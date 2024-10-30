/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('SignatureChecker', function () {
  // Define the fixture
  async function deploySignatureCheckerFixture() {
    // Get signers
    const [owner, other] = await ethers.getSigners();

    // Deploy test contract that uses SignatureChecker library
    const SignatureCheckerTestFactory = await ethers.getContractFactory(
      'SignatureCheckerTest',
    );
    const signatureCheckerTest = await SignatureCheckerTestFactory.deploy();
    await signatureCheckerTest.waitForDeployment();

    // Deploy SmartWallet
    const SmartWalletTestFactory =
      await ethers.getContractFactory('SmartWalletTest');
    const smartWallet = await SmartWalletTestFactory.deploy(owner.address);
    await smartWallet.waitForDeployment();

    // Common test message
    const message = 'Hello World';
    const messageHash = ethers.hashMessage(message);

    return {
      signatureCheckerTest,
      smartWallet,
      owner,
      other,
      message,
      messageHash,
    };
  }

  describe('EOA Signatures', function () {
    it('should validate a correct EOA signature', async function () {
      const { signatureCheckerTest, owner, message, messageHash } =
        await loadFixture(deploySignatureCheckerFixture);

      // Sign message
      const signature = await owner.signMessage(message);

      // Verify signature
      const isValid = await signatureCheckerTest.isValidSignatureNow(
        owner.address,
        messageHash,
        signature,
      );

      expect(isValid).to.be.true;
    });

    it('should reject an incorrect EOA signature', async function () {
      const { signatureCheckerTest, owner, other, message, messageHash } =
        await loadFixture(deploySignatureCheckerFixture);

      // Sign with wrong signer
      const signature = await other.signMessage(message);

      const isValid = await signatureCheckerTest.isValidSignatureNow(
        owner.address,
        messageHash,
        signature,
      );

      expect(isValid).to.be.false;
    });

    it('should reject a malformed signature', async function () {
      const { signatureCheckerTest, owner, messageHash } = await loadFixture(
        deploySignatureCheckerFixture,
      );

      // Create invalid signature
      const invalidSignature = '0x1234';

      const isValid = await signatureCheckerTest.isValidSignatureNow(
        owner.address,
        messageHash,
        invalidSignature,
      );

      expect(isValid).to.be.false;
    });
  });

  describe('ERC1271 Wallet Signatures', function () {
    it('should validate a correct smart wallet signature', async function () {
      const { signatureCheckerTest, smartWallet, owner, message, messageHash } =
        await loadFixture(deploySignatureCheckerFixture);

      // Sign with wallet owner
      const signature = await owner.signMessage(message);

      // Verify through smart wallet
      const isValid = await signatureCheckerTest.isValidSignatureNow(
        await smartWallet.getAddress(),
        messageHash,
        signature,
      );

      expect(isValid).to.be.true;
    });

    it('should reject incorrect smart wallet signature', async function () {
      const {
        signatureCheckerTest: testSignatureChecker,
        smartWallet,
        other,
        message,
        messageHash,
      } = await loadFixture(deploySignatureCheckerFixture);

      // Sign with non-owner
      const signature = await other.signMessage(message);

      // Verify through smart wallet
      const isValid = await testSignatureChecker.isValidSignatureNow(
        await smartWallet.getAddress(),
        messageHash,
        signature,
      );

      expect(isValid).to.be.false;
    });
  });
});
