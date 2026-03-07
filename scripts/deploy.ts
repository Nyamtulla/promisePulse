import hre from 'hardhat';

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const PromisePulse = await ethers.getContractFactory('PromisePulse');
  const contract = await PromisePulse.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('PromisePulse deployed to:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
