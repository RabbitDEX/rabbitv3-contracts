import {
  ADD_1BP_FEE_TIER,
  DEPLOY_MULTICALL2,
  DEPLOY_NFT_DESCRIPTOR_LIBRARY_V1,
  DEPLOY_NFT_POSITION_DESCRIPTOR_V1,
  DEPLOY_NONFUNGIBLE_POSITION_MANAGER,
  DEPLOY_PROXY_ADMIN,
  DEPLOY_QUOTER_V2,
  DEPLOY_SWAP_ROUTER,
  DEPLOY_TICK_LENS,
  DEPLOY_TRANSPARENT_PROXY_DESCRIPTOR,
  DEPLOY_V3_CORE_FACTORY,
  SET_PROTOCOL_FEE_DEFAULT,
} from './steps';

const DEPLOYMENT_STEPS = [
  DEPLOY_V3_CORE_FACTORY,
  ADD_1BP_FEE_TIER,
  SET_PROTOCOL_FEE_DEFAULT,

  DEPLOY_MULTICALL2,

  DEPLOY_TICK_LENS,
  DEPLOY_QUOTER_V2,

  DEPLOY_PROXY_ADMIN,
  DEPLOY_NFT_DESCRIPTOR_LIBRARY_V1,
  DEPLOY_NFT_POSITION_DESCRIPTOR_V1,
  DEPLOY_TRANSPARENT_PROXY_DESCRIPTOR,
  DEPLOY_NONFUNGIBLE_POSITION_MANAGER,

  DEPLOY_SWAP_ROUTER,
];

async function main() {
  for (const step of DEPLOYMENT_STEPS) {
    await step();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
