// Copyright (c) 2016-2017 Chef Software Inc. and/or applicable contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use hyper::status::StatusCode;

use api_client;
use common::ui::{Status, UI};

use {PRODUCT, VERSION};
use error::{Error, Result};

use super::promote::get_ident_list;

pub fn start(
    ui: &mut UI,
    bldr_url: &str,
    group_id: &str,
    channel: &str,
    origin: Option<&str>,
    interactive: bool,
    verbose: bool,
    token: &str,
) -> Result<()> {
    let api_client = api_client::Client::new(bldr_url, PRODUCT, VERSION, None)
        .map_err(Error::APIClient)?;

    let gid = match group_id.parse::<u64>() {
        Ok(g) => g,
        Err(e) => {
            ui.fatal(format!("Failed to parse group id: {}", e))?;
            return Err(Error::ParseIntError(e));
        }
    };

    let idents = get_ident_list(ui, bldr_url, gid, origin, interactive)?;

    if idents.len() == 0 {
        ui.warn("No matching packages found for demotion")?;
        return Ok(());
    }

    if verbose {
        println!("Packages being demoted:");
        for ident in idents.iter() {
            println!("  {}", ident)
        }
    }

    let question = format!(
        "Demoting {} package(s) to channel '{}'. Continue?",
        idents.len(),
        channel
    );

    if !ui.prompt_yes_no(&question, Some(true))? {
        ui.fatal("Aborted")?;
        return Ok(());
    }

    ui.status(
        Status::Demoting,
        format!("job group {} to channel '{}'", group_id, channel),
    )?;

    match api_client.job_group_demote(gid, &idents, channel, token) {
        Ok(_) => {
            ui.status(
                Status::Demoted,
                format!("job group {} to channel '{}'", group_id, channel),
            )?;
        }
        Err(api_client::Error::APIError(StatusCode::UnprocessableEntity, _)) => {
            return Err(Error::JobGroupDemoteUnprocessable);
        }
        Err(e) => {
            return Err(Error::JobGroupDemote(e));
        }
    };

    Ok(())
}
