'use client';

import Image from 'next/image';
import localFont from '@next/font/local';
import dynamic from 'next/dynamic';

import { useState, useCallback, useEffect } from 'react';
import 'chart.js/auto';
import { fetchWrapper, devnetMode } from '../utils/apiService';
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});

const data = [
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Stonks',
        data: [20, 50, 50, 40, -10, -20, 30, 50, 100, 300],
        fill: false,
        borderColor: '#40f641',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  },
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Stonks',
        data: [-20, -50, -50, -40, 10, 0, 30, 50, 25, 30],
        fill: false,
        borderColor: '#40f641',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  },
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Stonks',
        data: [30, 42, 78, 30, -10, -20, -30, -50, 30, -80],
        fill: false,
        borderColor: '#f04641',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  },
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Stonks',
        data: [20, 50, 50, 40, -10, -20, 30, 50, 100, 20],
        fill: false,
        borderColor: '#40f641',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  },
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Stonks',
        data: [20, -50, -50, 40, -10, -20, 30, -50, -100, -300],
        fill: false,
        borderColor: '#f04641',
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  }
];

const options = {
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
};

const pixelsFont = localFont({
  src: [
    {
      path: '../../public/fonts/light-pixel-7/light_pixel-7.ttf',
      weight: '400'
    },
    {
      path: '../../public/fonts/light-pixel-7/light_pixel-7.ttf',
      weight: '700'
    }
  ],
  variable: '--font-pixels'
});

import { Chain, sepolia } from "@starknet-react/chains";
import { StarknetConfig, starkscan } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import ControllerConnector from "@cartridge/connector";

const ETH_TOKEN_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

function provider(_chain: Chain) {
  return new RpcProvider({
    nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  });
}

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";

const StarknetProvider = ({children}: {children: React.ReactNode}) => {
  const connector = new ControllerConnector({
    policies: [
      {
        target: ETH_TOKEN_ADDRESS,
        method: "approve",
        description:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        target: ETH_TOKEN_ADDRESS,
        method: "transfer",
      },
      // Add more policies as needed
    ],
    rpc: "https://api.cartridge.gg/x/starknet/sepolia",
    // Uncomment to use a custom theme
    // theme: "dope-wars",
    // colorMode: "light"
  });

  return (
    <StarknetConfig
      autoConnect
      chains={[sepolia]}
      connectors={[connector as any]}
      explorer={starkscan}
      provider={provider}
    >
      {children}
    </StarknetConfig>
  );
}

const App = () => {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const connector = connectors[0] as unknown as ControllerConnector;

  const [username, setUsername] = useState<string>();
  useEffect(() => {
    if (!address) return;
    connector.username()?.then((n) => setUsername(n));
  }, [address, connector]);

  /* stonks: {
   * id: number,
   * name: string,
   * symbol: string,
   * denom: number,
   * }
   * balances: {
   * id: number,
   * balance: number,
   * }
  */
  const [stonks, setStonks] = useState(Array<{ id: number, name: string, symbol: string, denom: number }>());
  const [balances, setBalances] = useState(Array<number>());
  const [spendingPower, setSpendingPower] = useState(0.0);
  useEffect(() => {
    const fetchGameData = async () => {
      if (!address) return;
      let queryAddress = "";
      if (devnetMode) {
        queryAddress = "0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0";
      } else {
        queryAddress = address.slice(2).toLowerCase().padStart(64, '0');
      }
      let response = await fetchWrapper(`get-stonks`);
      if (!response.data) {
        console.error("Failed to fetch game data");
        return;
      }
      const stonks = response.data;
      setStonks(stonks);
      
      response = await fetchWrapper(`get-user-balances?address=${queryAddress}`);
      if (!response.data) {
        console.error("Failed to fetch user balances");
        return;
      }
      setSpendingPower(response.data.spendingPower);
      const balances = Array<number>(stonks.length).fill(0);
      if (!response.data.stonkBalances) {
        setBalances(balances);
        return;
      }
      response.data.stonkBalances.forEach((balance: any) => {
        balances[balance.stonkId] = balance.balance;
      });
      setBalances(balances);
    }
    fetchGameData();
  }, [address, username]);

  const doConnect = () => {
    const conn = connector as any;
    connect({ connector: conn });
  }

  const memecoins = [
      {
          "name": "To The Moon",
          "ticker": "TTM",
          "balance": 0.00000000,
          "denom": 0.001,
          "cost": 4.20,
          "change": 107.5,
          "multiplier": 1
      },
      {
          "name": "Wolvez",
          "ticker": "WLFZ",
          "balance": 0.00000000,
          "denom": 0.0001,
          "cost": 10.10,
          "change": 20.2,
          "multiplier": 2
      },
      {
          "name": "SafeRocket",
          "ticker": "SFR",
          "balance": 0.00000000,
          "denom": 0.01,
          "cost": 1.50,
          "change": -30.4,
          "multiplier": 1
      },
      {
          "name": "Buy Me",
          "ticker": "BM",
          "balance": 0.00000000,
          "denom": 0.00001,
          "cost": 100.69,
          "change": 0.0,
          "multiplier": 1
      },
      {
          "name": "Coolcoin",
          "ticker": "COOLC",
          "balance": 0.00000000,
          "denom": 0.0001,
          "cost": 0.90,
          "change": -100.4,
          "multiplier": 1
      }
  ];
  const [netWorth, setNetWorth] = useState(0.0);
  useEffect(() => {
      let newTotalBalance = 0.0;
      balances.forEach((balance, i) => {
          newTotalBalance += balance * memecoins[i].cost;
      });
      setNetWorth(newTotalBalance + spendingPower);
  }, [balances, spendingPower, memecoins]);

  const [storeOpen, setStoreOpen] = useState(false);
  const openStore = () => {
      setStoreOpen(true);
      console.log("Store opened :", storeOpen);
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => {
      setSettingsOpen(true);
      console.log("Settings opened :", settingsOpen);
  };

  interface ClaimAnimation {
    start: number;
    animId: string;
  }
  const [claimAnimations, setClaimAnimations] = useState<Array<ClaimAnimation>>([]);
  const claimAnimTime = 500;
  const claim = useCallback((index: number) => {
      const claimCall = async (index: number) => {
        const now = new Date().getTime();
        const animId = `plus-animation-${Math.floor(Math.random() * 6) + 1}`;
        setClaimAnimations([...claimAnimations, { start: now, animId }]);
        if (devnetMode) {
          const result = await fetchWrapper(`claim-stonk-devnet`, {
            mode: 'cors',
            method: 'POST',
            body: JSON.stringify({
              stonkId: stonks[index].id.toString(),
            })
          });
          if (result.result) {
            setBalances(balances.map((balance, i) => {
                if (i === index) {
                    return balance + (stonks[i].denom * memecoins[i].multiplier);
                }
                return balance;
            }
            ));
          } else {
            console.error("Failed to claim stonk");
          }
        }
      }
      claimCall(index);
  }, [claimAnimations, setClaimAnimations, balances, setBalances, memecoins, stonks]);

  const animInterval = claimAnimTime / 5;
  useEffect(() => {
    const interval = setInterval(() => {
      setClaimAnimations(claimAnimations.filter(({ start }) => {
        return new Date().getTime() - start < claimAnimTime
      }
      ));
    }, animInterval);
    return () => clearInterval(interval);
  }, [claimAnimations, animInterval]);

  return (
    <div className={`items-center justify-items-center p-0 h-full ${pixelsFont.variable} font-sans`}>
      <main className="flex flex-col gap-0 row-start-2 items-center justify-center w-full h-full">
        <div className="flex flex-row justify-between gap-1 bg-gradient-to-br from-[#1c36a3] to-[#1632a0] w-[99%] shadow-lg shadow-black-500/50 my-2 rounded-full border-2 border-[#467eb3]">
          <h1 className="text-3xl text-slate-150 ml-5 mt-4">
              stonks
          </h1>
          <div className="flex flex-row gap-3 mr-5">
              {address && (
                <div className="flex flex-row gap-10 items-center">
                    <div className="flex flex-row gap-1 items-center">
                        <Image
                            src="/icons/money.png"
                            alt="Wallet"
                            width={30}
                            height={30}
                            className="py-3 px-0"
                        />
                        <h4 className="text-md text-slate-150 pt-2 mr-1 text-center">
                            Spending Power:
                        </h4>
                        <h4 className="text-md text-slate-150 pt-2 mr-1 text-center">
                            ${spendingPower.toFixed(2)} USD
                        </h4>
                    </div>
                    <div className="flex flex-row gap-1 items-center">
                        <Image
                            src="/icons/stock.png"
                            alt="Wallet"
                            width={30}
                            height={30}
                            className="py-3 px-0"
                        />
                        <h4 className="text-md text-slate-150 pt-2 mr-1 text-center">
                            Net Worth:
                        </h4>
                        <h4 className="text-md text-slate-150 pt-2 mr-1 text-center">
                            ${netWorth.toFixed(2)} USD
                        </h4>
                    </div>
                    {username &&
                        <div className="flex flex-row gap-2 items-center">
                        <Image
                            src="/icons/user.png"
                            alt="User"
                            width={20}
                            height={20}
                            className="py-3 px-0"
                        />
                        <p
                            className="text-md text-slate-150 pt-2 mr-1 text-center"
                        >
                            {username}
                        </p>
                        </div>
                    }
                </div>
              )}
              <button
                className="rounded-xl justify-center items-center px-2 pt-2 m-1
                bg-gradient-to-br from-[#f6a021] to-[#f6c041] border-2 border-[#a67011] rounded-full
                text-slate-950
                focus:outline-none shadow-sm hover:drop-shadow-md
                transition duration-100 ease-in-out hover:scale-[102%] active:scale-[98%] hover:shadow-lg"
                onClick={() => {
                  address ? disconnect() : doConnect();
                }}
              >
                {address ? "Logout" : "Login"}
              </button>
              <button
                  onClick={openStore}
                  className="rounded-xl justify-center items-center p- rounded-[100%]
                  focus:outline-none drop-shadow-sm hover:drop-shadow-md
                  transition duration-300 ease-in-out hover:scale-110
                  active:scale-95"
              >
                  <Image
                      src="/icons/store.png"
                      alt="Refresh"
                      width={36}
                      height={36}
                  />
              </button>
              <button
                  onClick={openSettings}
                  className="rounded-xl justify-center items-center p-0 rounded-[100%]
                  focus:outline-none drop-shadow-sm hover:drop-shadow-md
                  transition duration-300 ease-in-out hover:scale-110
                  active:scale-95"
              >
                  <Image
                      src="/icons/gear.png"
                      alt="Refresh"
                      width={36}
                      height={36}
                  />
              </button>
          </div>
        </div>
        <div
            className="grid grid-row-1 grid-cols-1 w-full"
        >
            {stonks && balances && stonks.length === balances.length &&
             stonks.map((memecoin, index) => (
                <div
                  key={index}
                  className={`h-24 w-full border-[#467eb3] grid grid-cols-[2fr_1fr_2fr_1fr] ${index !== memecoins.length - 1 ? 'border-b-2' : ''}
                  `}
                >
                    <div className={`flex flex-col gap-1 items-center h-full
                                    border-r-2 border-[#467eb380] border-dotted
                                    ${index % 2 === 0 ? 'bg-[#00000000]' : 'bg-[#0030b080]'}
                                    `}>
                        <h3 className="text-2xl text-slate-150 pt-6">
                            {memecoin.name}
                        </h3>
                        <p className="text-md text-slate-150">
                            ( {memecoin.symbol} )
                        </p>
                    </div>
                    <div className={`flex flex-col gap-1 items-center h-full
                                    border-r-2 border-[#467eb380] border-dotted
                                    ${index % 2 === 1 ? 'bg-[#00000000]' : 'bg-[#0030b080]'}
                                    `}>
                        <h3 className="text-xl text-slate-150 pt-3">
                            {balances[index].toFixed(5)} {memecoin.symbol}
                        </h3>
                        <p className={`text-sm ${memecoins[memecoin.id].change >= 0 ? "text-[#46f041]" : "text-[#f64041]"}`}>
                            {memecoins[memecoin.id].change >= 0 ? "+" : ""}
                            {memecoins[memecoin.id].change.toFixed(1)}%
                        </p>
                        <p className={`text-xs ${memecoins[memecoin.id].change >= 0 ? "text-[#46f041]" : "text-[#f64041]"}`}>
                            {(memecoins[memecoin.id].cost * balances[index]).toFixed(2)} USD
                        </p>
                    </div>
                    <div className={`flex flex-row gap-6 justify-center items-center h-full
                                    border-r-2 border-[#467eb380] border-dotted
                                    ${index % 2 === 0 ? 'bg-[#00000000]' : 'bg-[#0030b080]'}
                                    `}>
                        <div className="relative">
                        {claimAnimations.map(({ start, animId }) => (
                          <p
                            key={start}
                            className={`absolute top-[-25%] left-[35%] text-xs text-[#f6f071] font-bold drop-shadow-lg
                                       p-1 z-10 ${animId} cursor-none select-none`}
                          >
                              +1
                          </p>
                        ))}
                        {memecoin.multiplier > 1 &&
                        <p className="absolute top-[-5px] right-[-10px] text-xs text-[#f6f071] font-bold drop-shadow-lg p-1 z-10 cursor-none select-none
                            rotate-[45deg] drop-shadow-lg">
                            {memecoin.multiplier}x
                        </p>
                        }
                        <button
                            onClick={() => claim(index)}
                            className="rounded-xl justify-center items-center px-4 rounded-[100%]
                            bg-gradient-to-br from-[#f6a021] to-[#f6c041] border-2 border-[#a67011] rounded-full
                            text-slate-950 pt-2
                            focus:outline-none shadow-sm hover:drop-shadow-md
                            transition duration-100 ease-in-out hover:scale-[102%] active:scale-[98%] hover:shadow-lg"
                        >
                            Claim
                        </button>
                        </div>
                        <button
                            className="rounded-xl justify-center items-center rounded-[100%]
                            bg-gradient-to-br from-[#66f021] to-[#86f041] border-2 border-[#b6f081] rounded-full
                            text-slate-950 flex flex-row space-between
                            focus:outline-none shadow-sm hover:drop-shadow-md
                            transition duration-100 ease-in-out hover:scale-[102%] active:scale-[98%] hover:shadow-lg"
                        >
                            <p className="px-2 pt-2">
                                Buy
                            </p>
                            <Image
                                src="/icons/down.png"
                                className="px-1 border-l-2 border-black"
                                alt="Refresh"
                                width={24}
                                height={24}
                            />
                        </button>
                        <button
                            className="rounded-xl justify-center items-center px-4 rounded-[100%]
                            bg-gradient-to-br from-[#f63021] to-[#f64041] border-2 border-[#a65011] rounded-full
                            text-slate-950 pt-2
                            focus:outline-none shadow-sm hover:drop-shadow-md
                            transition duration-100 ease-in-out hover:scale-[102%] active:scale-[98%] hover:shadow-lg"
                        >
                            Sell
                        </button>
                    </div>
                    <div className={`flex flex-row gap-1 items-center h-24 p-2
                                    border-r-2 border-[#467eb380] border-dotted
                                    ${index % 2 === 1 ? 'bg-[#00000000]' : 'bg-[#0030b080]'}
                                    `}>
                        <Line data={data[index]} className="w-full h-20" options={options} />
                        <div className="flex flex-col gap-1">
                            <p className={`text-xs text-slate-150 ml-8 text-center
                                        ${memecoins[memecoin.id].change >= 0 ? "text-[#46f041]" : "text-[#f64041]"}
                                        `}>
                                {memecoins[memecoin.id].cost.toFixed(2)} USD
                            </p>
                            <p className={`text-xs text-slate-150 ml-8 text-center
                                        ${memecoins[memecoin.id].change >= 0 ? "text-[#46f041]" : "text-[#f64041]"}
                                        `}>
                                {memecoins[memecoin.id].change >= 0 ? "+" : ""}
                                {memecoins[memecoin.id].change.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}

export default function Home() {

  return (
    <StarknetProvider>
      <App />
    </StarknetProvider>
  );
}
