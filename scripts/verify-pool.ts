import hre from 'hardhat';

type Pool = {
  id: string;
};

const POOLS: Pool[] = [
  {
    id: '0x05102baB5baFCDBD67c0555dab7Ad84132821395',
  },
  {
    id: '0x138E139Db56D5ADdac9eFc32846df7bFC66DA6F2',
  },
  {
    id: '0x17D07d4A8C965d47643309e728E926C4e2ff02b4',
  },
  {
    id: '0x24958ca084371F89c049074b911bd42F8c517604',
  },
  {
    id: '0x2a635D63aa3c8adC5184075AE4477F90FF904003',
  },
  {
    id: '0x2aE031783282EB4b4F1Ae54D3d9235f254Cc8A19',
  },
  {
    id: '0x316294D755BD450f218a18Add307Ad2D510261F1',
  },
  {
    id: '0x3D8f23f1Fc774e8A9108685bAca1Adf8aaFc0778',
  },
  {
    id: '0x4B289482978f5fAac98FaE761fd3b03E42111b14',
  },
  {
    id: '0x4D612bA1C411401Ba96937fC0Eeae2cf48e845A1',
  },
  {
    id: '0x4d5aee919558acbA94EdE0EFDfb35998d5448519',
  },
  {
    id: '0x4ec7B24B75304339C342fd7091ea605F4Ec67812',
  },
  {
    id: '0x51E0D1946c19Da91cEc8791C0D8f2249eb16481e',
  },
  {
    id: '0x548677e7B8B65734eE024b8A368455BFE7fDcfD6',
  },
  {
    id: '0x554102826C786C40C5818C73f02DBE5F14B7cb9F',
  },
  {
    id: '0x56DA98A21cd587742EA20201b2981cae1fDe1E39',
  },
  {
    id: '0x59bE42E5151b699a4643E86D1e7093BE3E289770',
  },
  {
    id: '0x6a602681B8607C6436F239bD125bae336D5c8999',
  },
  {
    id: '0x701Db3c70a5B2AA30E9bC1780E0A23387Af9679f',
  },
  {
    id: '0x71E13F27bdC187994556045b8c4BF5465185f16B',
  },
  {
    id: '0x7659326288Ede659491f5595F7391eD567306889',
  },
  {
    id: '0x8D2eb448178cd4191Dd6bf411D29f3250A54ecCD',
  },
  {
    id: '0x920ea2f94cE3aa79d91876616f5F1363f9f8e430',
  },
  {
    id: '0x95aF0Dd7B18c78632aF5F6fB638bcc9863fA9455',
  },
  {
    id: '0x9Cd5E16A9CbCc738d5FD09c0BD2cbC52265Fc546',
  },
  {
    id: '0x9a8d0d67FA6C15104E9Df74F65Cab8941B85af05',
  },
  {
    id: '0xA41904b47BB09713a4D064aDaD8Ccd16F57eb3c6',
  },
  {
    id: '0xAE042b338c2F39888b1C6cD162231867fc42Cc2a',
  },
  {
    id: '0xC237a305B114496F542e0450f1Db159fC4563Ea8',
  },
  {
    id: '0xC3909005287224233Ca6616Bfe79F61aA99410cC',
  },
  {
    id: '0xC8E762af329FFa942f89f4528092f37323514Cea',
  },
  {
    id: '0xEe8633442F8b6abb1e8238a1dD11F3Fc56B4bB75',
  },
  {
    id: '0xEfA7664aC5a9DbF9577288Af8670bA65762a99BB',
  },
  {
    id: '0xF10eFaE2DdAC396c4ef3c52009dB429A120d0C0D',
  },
  {
    id: '0xa26872C08eE12899F64978E3f3A39f841D3E124e',
  },
  {
    id: '0xa28ef0EDbc30aF7B78c7828C032A628d54256CD0',
  },
  {
    id: '0xa3410429C8d44f76Db5E6ff277E92E7FcAAB8DC8',
  },
  {
    id: '0xa7c3eAfBa9E11e17de751D553DB298918041C980',
  },
  {
    id: '0xd7eA33a2c0f8226F2E0f46a2e6A851be575a7022',
  },
  {
    id: '0xe0dB1CC1b42Ee2AdDA20CAdC2C143Dcb31b3f51A',
  },
  {
    id: '0xe4C7310f936b79435D35476407873614EebB1B4E',
  },
  {
    id: '0xe5475Fca0c43F3a8a48f738755f24Fc38feC2eB3',
  },
  {
    id: '0xe5a0Dcd209707134c7C71d706844626dd4eF4936',
  },
];

async function verifyPool(pool: Pool) {
  console.log(`Verifying pool ${pool.id}`);
  await hre.run('verify:verify', {
    address: pool.id,
    constructorArguments: [],
    contract: 'contracts/core/RabbitSwapV3Pool.sol:RabbitSwapV3Pool',
  });
}

async function main() {
  for (const pool of POOLS) {
    await verifyPool(pool);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
