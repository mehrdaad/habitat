+++
title = "Upload and Promote Packages"
description = "Upload and Promote Packages"

[menu]
  [menu.habitat]
    title = "Upload and Promote Packages"
    identifier = "habitat/builder/sharing-pkgs"
    parent = "habitat/builder"
    weight = 20

+++

While you can build and run Chef Habitat packages without sharing them on [Chef Habitat Builder](https://bldr.habitat.sh), uploading them there enables greater collaboration and automated package rebuilds as underlying dependencies or your connected GitHub repository are updated.

> Note: Chef Habitat Builder can only build Linux based plans (`plan.sh`) at this time.

Setting up Chef Habitat Builder is easily done on the website: these steps take you through connecting your local Studio development experience with Builder.

You interact with Chef Habitat Builder by:

* Creating an account.
* Creating an origin, or being invited to join an origin that already exists.
* Setting up `hab` to authenticate with Builder.
* Uploading the private and public keys for that origin.
* Connecting your Github repositories and opting into rebuilds.

Chef Habitat Builder supports both public and private origins, packages, and Github repositories.

## Create a Builder Account

If you haven't created an account yet, see the [Create a Builder Account](/docs/using-builder/builder-account) section above.

## Create or Join an Existing Origin

You can create your own origin in Builder or be invited to join an existing one. If you already built some Chef Habitat packages on your local computer prior to signing up for an account, you must rename your local packages' `pkg_origin` if the origin you want already exists.

## Set up Chef Habitat to Authenticate to Builder

When you upload a package to Builder, you are required to supply an auth token as part of the `hab pkg upload` subcommand. You can generate a Chef Habitat personal access token via the Builder site [Profile page](https://bldr.habitat.sh/#/profile) for use with the `hab` command-line utility.

Once you have this token, you can set the `HAB_AUTH_TOKEN` [environment variable](/docs/reference#environment-variables) to this value, so that any commands requiring authentication will use it.

## Create an Origin Key Pair

After finishing the basic account creation steps, you need to create your origin key pair. Habitat will use the private origin key to sign the artifacts (`.hart` files) created by building your plan and verify the integrity of your artifacts with the public origin key.

You can create an origin key pair by running `hab cli setup` from your host machine, or by running `hab origin key generate <ORIGIN>` from either the host machine or from within the studio.

Your public and private origin keys are located at `~/.hab/cache/keys` on your host machine and at `/hab/cache/keys` inside the studio environment.

## Upload Your Origin Keys

If you created a new Habitat origin from your host machine or from the Studio, Builder will not have either of the origin keys corresponding to your artifact. Builder will not accept uploaded artifacts without first having the correct origin public key.

You can upload keys for the origin through the web interface for Builder, or by using the `hab origin key upload` command. You must have the access token for authentication, as described earlier, before you can upload keys.

## Upload Packages to Builder

As long as you are already a member of the Habitat origin, once Builder possesses at least the public origin key, then you may upload one or more artifacts to that origin with the `hab pkg upload` command. After Habitat validates the cryptographic integrity of the artifact, it is then uploaded and stored on Builder. Uploading artifacts is a privileged operation for which you must have the access token.

## Promote Packages

<%= partial "/partials/global/channel-overview" %>

By default, newly uploaded packages are placed in the `unstable` channel. However, the default package that is downloaded is the latest `stable` version of a package, unless overridden in commands such as `hab sup run`, `hab svc load`, and `hab pkg install`. If you want to promote your package to the `stable` channel, run the `hab pkg promote` command as follows:

```bash
$ hab pkg promote -z <TOKEN> origin/package/version/release stable
```

> **Note** You can also promote packages to the `stable` channel using the *promote to stable* button in the web app.

For more information on how to use channels, see [Continuous Deployment Using Channels](/docs/using-habitat/continuous-deployment).

## Running Packages from Builder

> **Note:** When running private packages from Builder, it's necessary to add your [Chef Habitat access token](/docs/using-builder/builder-token) to the machine where you intend to deploy the package, via `export HAB_AUTH_TOKEN=<token>`.

You can instruct the Supervisor to download and run packages from Builder by using the `hab sup` and `hab svc` commands, for example:

```bash
$ hab sup run
$ hab svc load core/postgresql
```

If the Supervisor does not have the `core/postgresql` package in its local cache, it will contact Builder, retrieve the latest version and the public key for the `core` origin, verify the cryptographic integrity of the package, and then start it.

You may also supply a `--channel` argument to instruct the Supervisor to use a different channel for the purposes of continuous deployment:

```bash
$ hab svc load core/postgresql --channel unstable
```

## Running Packages from Exported Tarballs

An exported tarball package contains the Chef Habitat client/binary as well as dependencies specified by your artifact.

After deploying the tarball to your target server, extract the contents to the root filesystem (`/`):

```bash
$ tar zxf core-nginx-1.11.10-20170616000025.tar.gz --directory /
```

You can instruct the Supervisor to run packages from an exported tarball:

```bash
$ /hab/bin/hab svc start core/nginx
```

Note: On a clean server, this will download additional packages to satisfy the Supervisor dependencies. You will also require a `hab` group and `hab` user on the system for most services.
