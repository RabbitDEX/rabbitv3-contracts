import { ethers } from "hardhat";
import hre from "hardhat";
import { addressFor } from "./metadata";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockERC20 with account:", deployer.address);

  // Deploy MockERC20 contract
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  // Deploy token with name and symbol
  const name = "Mock Token";
  const symbol = "MOCK";
  
  const mockToken = await MockERC20.deploy(name, symbol);
  const deployedToken = await mockToken.waitForDeployment();
  const tokenAddress = await deployedToken.getAddress();

  console.log("MockERC20 deployed to:", tokenAddress);
  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  
  // Mint some tokens to the deployer
  const mintAmount = ethers.parseEther("1000000"); // 1 million tokens
  await deployedToken.mint(deployer.address, mintAmount);
  console.log("Minted:", ethers.formatEther(mintAmount), "tokens to deployer");

  // Verify contract on Etherscan
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [name, symbol],
      contract: "contracts/mocks/MockERC20.sol:MockERC20"
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

/**
 * Approves the MockERC20 token for RabbitSponsoredFarm
 * @param tokenAddress The address of the MockERC20 token
 * @param amount The amount to approve (defaults to maximum uint256 value)
 */
export async function approveForFarm(
  tokenAddress: string,
  amount: string = ethers.MaxUint256.toString()
) {
  const farmAddress = addressFor('RabbitSponsoredFarm_Proxy')
  console.log(`Approving token ${tokenAddress} for farm ${farmAddress}...`);
  
  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("MockERC20", tokenAddress);
  
  const tx = await token.approve(farmAddress, amount);
  await tx.wait();
  
  console.log(`Approval successful! Transaction hash: ${tx.hash}`);
  console.log(`Approved amount: ${amount === ethers.MaxUint256.toString() ? "Maximum (unlimited)" : ethers.formatEther(amount)}`);
  
  // Verify the allowance
  const allowance = await token.allowance(signer.address, farmAddress);
  console.log(`Current allowance: ${ethers.formatEther(allowance)}`);
  
  return tx;
}

// Execute the deployment
// main()
approveForFarm('0xBB2Baa333C07bb978c10de0F14d5809cbC82cFE8')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
