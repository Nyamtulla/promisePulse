require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY must be set in .env');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('Deploying with account:', wallet.address);

  const artifactPath = path.join(
    __dirname,
    '..',
    'artifacts',
    'contracts',
    'PromisePulse.sol',
    'PromisePulse.json'
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('PromisePulse deployed to:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
