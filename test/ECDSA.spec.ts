import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('ECDSA', function () {
  // Deploy fresh contract for each test
  async function deployECDSATest() {
    // Get signers
    const [owner] = await ethers.getSigners();

    // Deploy test contract
    const ECDSATestFactory = await ethers.getContractFactory('ECDSATest');
    const ecdsa = await ECDSATestFactory.deploy();
    await ecdsa.waitForDeployment();

    return { ecdsa, owner };
  }

  it('should recover signer address correctly', async function () {
    const { ecdsa, owner } = await loadFixture(deployECDSATest);

    // Create message hash
    const message = 'Hello World';
    const messageHash = ethers.hashMessage(message);

    // Get signature
    const signature = await owner.signMessage(message);

    // Recover signer using contract
    const recoveredSigner = await ecdsa.recover(messageHash, signature);

    // Verify recovered address matches signer
    expect(recoveredSigner).to.equal(owner.address);
  });

  it('should fail to recover from invalid signature', async function () {
    const { ecdsa } = await loadFixture(deployECDSATest);

    const message = 'Hello World';
    const messageHash = ethers.hashMessage(message);

    // Create invalid signature (just wrong length)
    const invalidSignature = '0x1234';

    // Should revert with invalid signature length
    await expect(
      ecdsa.recover(messageHash, invalidSignature),
    ).to.be.revertedWith('ECDSA: invalid signature length');
  });
});
