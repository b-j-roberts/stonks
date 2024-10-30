'use client';

import Image from 'next/image';
import localFont from '@next/font/local';
import dynamic from 'next/dynamic';

import { useState, useCallback, useEffect } from 'react';
import 'chart.js/auto';
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

export default function Home() {
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
          "cost": 0.10,
          "change": 20.2,
          "multiplier": 2
      },
      {
          "name": "SafeRocket",
          "ticker": "SFR",
          "balance": 0.00000000,
          "denom": 0.01,
          "cost": 0.50,
          "change": -30.4,
          "multiplier": 1
      },
      {
          "name": "Buy Me",
          "ticker": "BM",
          "balance": 0.00000000,
          "denom": 0.00001,
          "cost": 0.01,
          "change": 0.0,
          "multiplier": 1
      },
      {
          "name": "Coolcoin",
          "ticker": "COOLC",
          "balance": 0.00000000,
          "denom": 0.0001,
          "cost": 0.10,
          "change": -100.4,
          "multiplier": 1
      }
  ];
  const [balances, setBalances] = useState(memecoins.map(memecoin => memecoin.balance));

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
      const now = new Date().getTime();
      const animId = `plus-animation-${Math.floor(Math.random() * 6) + 1}`;
      setClaimAnimations([...claimAnimations, { start: now, animId }]);
      console.log("balances before :", balances, "index :", index);
      setBalances(balances.map((balance, i) => {
          if (i === index) {
              return balance + (memecoins[i].denom * memecoins[i].multiplier);
          }
          return balance;
      }
      ));
  }, [claimAnimations, setClaimAnimations, balances, setBalances, memecoins]);

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
          <h1 className="text-3xl text-slate-150 ml-5 mt-3">
              stonks
          </h1>
          <div className="flex flex-row gap-3 mr-5">
              <button
                  onClick={openStore}
                  className="rounded-xl justify-center items-center p- rounded-[100%]
                  focus:outline-none drop-shadow-sm hover:drop-shadow-md
                  transition duration-300 ease-in-out hover:scale-110"
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
                  transition duration-300 ease-in-out hover:scale-110"
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
            {memecoins.map((memecoin, index) => (
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
                            ( {memecoin.ticker} )
                        </p>
                    </div>
                    <div className={`flex flex-col gap-1 items-center h-full
                                    border-r-2 border-[#467eb380] border-dotted
                                    ${index % 2 === 1 ? 'bg-[#00000000]' : 'bg-[#0030b080]'}
                                    `}>
                        <h3 className="text-xl text-slate-150 pt-3">
                            {balances[index].toFixed(5)} {memecoin.ticker}
                        </h3>
                        <p className={`text-sm ${memecoin.change >= 0 ? "text-[#46f041]" : "text-[#f64041]"}`}>
                            {memecoin.change.toFixed(1)}%
                        </p>
                        <p className={`text-xs ${memecoin.change >= 0 ? "text-[#46f041]" : "text-[#f64041]"}`}>
                            {(memecoin.cost * balances[index]).toFixed(2)} USD
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
                    <div className={`flex flex-col gap-1 items-center h-full
                                    border-r-2 border-[#467eb380] border-dotted
                                    ${index % 2 === 1 ? 'bg-[#00000000]' : 'bg-[#0030b080]'}
                                    `}>
                        <Line data={data[index]} className="w-full h-full" options={options} />
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
