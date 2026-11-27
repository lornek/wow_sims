// Deploy the exact upload result, avoiding deploy-pages' separate artifact discovery service.
module.exports = async function deployPages({github,context,core,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),artifactId=process.env.PAGES_ARTIFACT_ID,artifactName=process.env.PAGES_ARTIFACT}) {
  if(!/^\d+$/.test(artifactId??''))throw new Error('Missing valid Pages upload artifact ID');
  const repo=context.repo;
  let artifact;
  for(let attempt=0;attempt<15;attempt++){
    try{artifact=(await github.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}',{...repo,artifact_id:Number(artifactId)})).data;break;}
    catch(error){if(error.status!==404&&error.status!==429&&!(error.status>=500))throw error;if(attempt===14)throw error;await wait(2000);}
  }
  if(artifact.expired||artifact.name!==artifactName||String(artifact.workflow_run?.id)!==String(context.runId))throw new Error('Pages artifact does not match this workflow upload');
  core.info(`Deploying verified artifact ${artifactId} (${artifact.name}) for ${context.sha}`);
  const oidc_token=await core.getIDToken();
  core.setSecret(oidc_token);
  const {data:deployment}=await github.request('POST /repos/{owner}/{repo}/pages/deployments',{...repo,artifact_id:Number(artifactId),pages_build_version:context.sha,oidc_token});
  const id=deployment.id??deployment.status_url?.split('/').pop();
  if(!id)throw new Error('Pages did not return a deployment ID');
  core.setOutput('page_url',deployment.page_url);
  core.info(`Pages deployment ${id} created`);
  const failures=new Set(['deployment_failed','deployment_content_failed','deployment_cancelled','deployment_lost','failed','cancelled']);
  for(let attempt=0;attempt<120;attempt++){
    const {data:status}=await github.request('GET /repos/{owner}/{repo}/pages/deployments/{deployment_id}',{...repo,deployment_id:id});
    core.info(`Pages status: ${status.status}`);
    if(status.status==='succeed'){core.setOutput('status','succeed');return;}
    if(failures.has(status.status))throw new Error(`Pages deployment failed: ${status.status}`);
    await wait(5000);
  }
  throw new Error(`Pages deployment ${id} did not finish within 10 minutes; inspect its status before retrying`);
};
