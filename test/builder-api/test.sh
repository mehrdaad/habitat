#!/bin/bash

# Check to see if a command exists
exists() {
  if command -v $1 >/dev/null 2>&1
  then
    return 0
  else
    return 1
  fi
}

# base_dir is the root of the habitat project.
base_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp_dir=/tmp
pg_tmp_version=2.3

if ! exists curl; then
  echo "curl is required to run the integration tests. Please ensure it's installed and try again."
  exit 1
fi

if ! exists hab; then
  echo "The Habitat CLI is required to run the integration tests. Please ensure it's installed and try again."
  exit 1
fi

if exists md5sum; then
  md5=md5sum
elif exists md5; then
  md5=md5
else
  echo "A program to calculate the md5 hash of a string is required to run the integration tests. Please sort this out and try again."
  exit 1
fi

# First make sure that we have services already compiled to test.
cd $base_dir

# TODO JB: uncomment this line so it actually builds
#make build-srv || exit $?
cd $tmp_dir

if [[ $(uname -a) == *"Darwin"* ]]; then
  platform="mac"
else
  platform="linux"
fi

name=$(date | $md5 | awk '{ print $1 }')
dir="$tmp_dir/$name"
key_dir="$dir/key-dir"

mkdir -p $dir $key_dir

env HAB_CACHE_KEY_PATH=$key_dir hab user key generate bldr

# Install pg_tmp if it's not there already
if ! exists pg_tmp; then
  echo "These tests require the use of pg_tmp. Installing version $pg_tmp_version now."
  cd $dir
  curl -O "http://ephemeralpg.org/code/ephemeralpg-$pg_tmp_version.tar.gz"
  tar zxvf ephemeralpg-$pg_tmp_version.tar.gz
  cd eradman-ephemeralpg-038b5747af8d
  make install
fi

if ! exists pg_tmp; then
  echo "Something went wrong installing pg_tmp. Aborting."
  exit 1
fi

# Ensure normal pg commands are available for pg_tmp
if ! exists pg_ctl; then
  hab pkg install core/postgresql
  hab pkg binlink core/postgresql
fi

# This will produce a URI that looks like
# postgresql://hab@127.0.0.1:39605/test
pg=$(sudo su hab -c "pg_tmp -t -w 240 -o \"-c max_locks_per_transaction=128\"")
port=$(echo "$pg" | awk -F ":" '{ print $3 }' | awk -F "/" '{ print $1 }')

# Write out some config files
cat << EOF > $dir/config_api.toml
[depot]
builds_enabled = true
non_core_builds_enabled = true
key_dir = "$key_dir"

[github]
app_private_key = "$key_dir/builder-github-app.pem"

[segment]
write_key = "hahano"
EOF

cat << EOF > $dir/config_jobsrv.toml
key_dir = "$key_dir"

[archive]
backend = "local"
local_dir = "/tmp"

[datastore]
host = "127.0.0.1"
port = $port
user = "hab"
database = "test"
connection_retry_ms = 300
connection_timeout_sec = 3600
connection_test = false
pool_size = 8
EOF

cat << EOF > $dir/config_sessionsrv.toml
[permissions]
admin_team = 1995301
build_worker_teams = [2555389]
early_access_teams = [1995301]

[github]
app_private_key = "$key_dir/builder-github-app.pem"

[datastore]
host = "127.0.0.1"
port = $port
user = "hab"
database = "test"
connection_retry_ms = 300
connection_timeout_sec = 3600
connection_test = false
pool_size = 8
EOF

cat << EOF > $dir/config_worker.toml
auth_token = "hahano"
bldr_url = "http://localhost:9636"
auto_publish = true
data_path = "/tmp"

[github]
app_private_key = "$key_dir/builder-github-app.pem"
EOF

cat << EOF > $dir/config_originsrv.toml
[datastore]
host = "127.0.0.1"
port = $port
user = "hab"
database = "test"
connection_retry_ms = 300
connection_timeout_sec = 3600
connection_test = false
pool_size = 8
EOF

cat << EOF > $dir/Procfile
api: $base_dir/target/debug/bldr-api start --path $dir/depot --config $dir/config_api.toml
router: $base_dir/target/debug/bldr-router start
jobsrv: $base_dir/target/debug/bldr-jobsrv start --config $dir/config_jobsrv.toml
sessionsrv: $base_dir/target/debug/bldr-sessionsrv start --config $dir/config_sessionsrv.toml
originsrv: $base_dir/target/debug/bldr-originsrv start --config $dir/config_originsrv.toml
worker: $base_dir/target/debug/bldr-worker start --config $dir/config_worker.toml
EOF

cat << EOF > $dir/bldr.env
RUST_LOG=debug
RUST_BACKTRACE=1
HAB_DOCKER_STUDIO_IMAGE="habitat-docker-registry.bintray.io/studio"
EOF

# TODO JB: Probably need to grab the GH dev key too or lots of stuff will likely break

# Start all the services up

if [ "$platform" = "mac" ]; then
  env HAB_FUNC_TEST=1 "$base_dir/support/mac/bin/forego" start -f "$dir/Procfile" -e "$dir/bldr.env" > "$dir/services.log" 2>&1 &
else
  env HAB_FUNC_TEST=1 "$base_dir/support/linux/bin/forego" start -f "$dir/Procfile" -e "$dir/bldr.env" > "$dir/services.log" 2>&1 &
fi

forego_pid=$!

echo "**** Spinning up the services ****"
total=0
originsrv=0
sessionsrv=0
router=0
api=0
jobsrv=0
worker=0

while [ $total -ne 6 ]; do
  for svc in originsrv sessionsrv router api jobsrv worker; do
    if grep -q "builder-$svc is ready to go" "$dir/services.log"; then
      declare "$svc=1"
    else
      echo "Waiting on $svc"
    fi
  done

  total=$(($originsrv + $sessionsrv + $router + $api + $jobsrv + $worker))

  echo ""
  sleep 1
done
echo "**** All services ready ****"

# Run the tests
cd "$base_dir/test/builder-api"
npm run mocha
mocha_exit_code=$?
echo "**** Stopping services ****"
kill -INT $forego_pid
cd $tmp_dir
rm -fr $dir
exit $mocha_exit_code
