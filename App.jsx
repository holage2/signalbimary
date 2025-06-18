import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, BarChart3, Zap, Settings, AlarmClock as ClockIcon, Send } from 'lucide-react';

import { ALL_CURRENCY_PAIRS, AVAILABLE_TIMEFRAMES, MAJOR_TIMEZONES } from '@/constants';
import { generateCandleData, getTimeframeToMinutes, formatTimeByTimezone } from '@/utils/chartUtils';
import { generateMarketDataLogic, generateSignalForPairLogic } from '@/services/marketService';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import TradingChart from '@/components/TradingChart';
import SignalCard from '@/components/SignalCard';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketData, setMarketData] = useState({});
  const [activeSignal, setActiveSignal] = useState(null);
  const [selectedPair, setSelectedPair] = useState(ALL_CURRENCY_PAIRS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(AVAILABLE_TIMEFRAMES[0]);
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const [chartData, setChartData] = useState([]);

  const updateMarketData = useCallback(() => {
    setMarketData(prevMarketData => generateMarketDataLogic(prevMarketData));
  }, []);

  useEffect(() => {
    const initialData = generateMarketDataLogic();
    setMarketData(initialData);
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const marketDataInterval = setInterval(updateMarketData, 3000); 
    
    return () => {
      clearInterval(clockInterval);
      clearInterval(marketDataInterval);
    };
  }, [updateMarketData]);
  
  useEffect(() => {
    if (marketData[selectedPair] && typeof marketData[selectedPair].price === 'number') {
      const timeframeMinutes = getTimeframeToMinutes(selectedTimeframe);
      setChartData(generateCandleData(marketData[selectedPair].price, 100, timeframeMinutes));
    } else if (Object.keys(marketData).length > 0 && ALL_CURRENCY_PAIRS.length > 0 && marketData[ALL_CURRENCY_PAIRS[0]]) {
      const fallbackPrice = marketData[ALL_CURRENCY_PAIRS[0]]?.price || 1.0;
      const timeframeMinutes = getTimeframeToMinutes(selectedTimeframe);
      setChartData(generateCandleData(fallbackPrice, 100, timeframeMinutes));
    }
  }, [marketData, selectedPair, selectedTimeframe]);

  const handleAnalyze = () => {
    if (!selectedPair || !selectedTimeframe) {
      toast({
        title: '⚠️ Missing Selection',
        description: 'Please select a currency pair and a timeframe.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setIsAnalyzing(true);
    setActiveSignal(null); 

    const analysisTime = Math.random() * 1500 + 800; 
    setTimeout(() => {
      const signal = generateSignalForPairLogic(selectedPair, selectedTimeframe, marketData);
      setActiveSignal(signal);
      setIsAnalyzing(false);
      if (signal) {
        // Signal toast notification removed as per request
      } else {
         toast({
          title: '🤔 No Clear Signal',
          description: `Could not determine a strong signal for ${selectedPair} on ${selectedTimeframe} at this moment. Try again or adjust parameters.`,
          variant: 'default',
          duration: 3000,
        });
      }
    }, analysisTime);
  };

  const handleTimezoneChange = (value) => {
    setSelectedTimezone(value);
    toast({
      title: '🌍 Timezone Updated',
      description: `Display time set to ${MAJOR_TIMEZONES.find(tz => tz.value === value)?.label || value}.`,
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col">
      <Toaster />
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-500 flex items-center"
          >
            <Zap className="w-8 h-8 mr-2 text-cyan-400" />
            Binary Signal Pro
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 shadow-md"
          >
            <ClockIcon size={16} className="text-cyan-400"/>
            {formatTimeByTimezone(currentTime, selectedTimezone)}
          </motion.div>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1 bg-slate-800/70 backdrop-blur-md p-5 sm:p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-5"
        >
          <div>
            <label htmlFor="currencyPairSelect" className="block text-sm font-medium text-slate-300 mb-1.5">Currency Pair</label>
            <Select inputId="currencyPairSelect" value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-full bg-slate-700/50 border-slate-600 text-slate-100 focus:ring-sky-500 focus:border-sky-500">
                <SelectValue placeholder="Select Pair" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-72">
                {ALL_CURRENCY_PAIRS.map(pair => (
                  <SelectItem key={pair} value={pair} className="hover:bg-slate-700 focus:bg-slate-700">
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="timeframeSelect" className="block text-sm font-medium text-slate-300 mb-1.5">Timeframe</label>
            <Select inputId="timeframeSelect" value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-full bg-slate-700/50 border-slate-600 text-slate-100 focus:ring-sky-500 focus:border-sky-500">
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {AVAILABLE_TIMEFRAMES.map(tf => (
                  <SelectItem key={tf} value={tf} className="hover:bg-slate-700 focus:bg-slate-700">
                    {tf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="timezoneSelect" className="block text-sm font-medium text-slate-300 mb-1.5">Display Timezone</label>
            <Select inputId="timezoneSelect" value={selectedTimezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full bg-slate-700/50 border-slate-600 text-slate-100 focus:ring-sky-500 focus:border-sky-500">
                <SelectValue placeholder="Select Timezone" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-60">
                {MAJOR_TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value} className="hover:bg-slate-700 focus:bg-slate-700">
                    {tz.label}
                  </SelectItem>
                ))}
                 <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone} className="hover:bg-slate-700 focus:bg-slate-700 italic">
                    Use My Browser Timezone
                  </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full py-3 text-base font-semibold bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isAnalyzing ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                />
                Analyzing...
              </>
            ) : (
              <> <Zap size={18} className="mr-2"/> Start Analyzing </>
            )}
          </Button>

          <div className="mt-auto pt-5 border-t border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center"><Settings size={20} className="mr-2 text-sky-400"/>Market Snapshot</h3>
              <div className="text-xs text-slate-400 space-y-1.5">
                  <p>Price: <span className="font-mono text-slate-200">{marketData[selectedPair]?.price?.toFixed(5) || 'N/A'}</span></p>
                  <p>Change: <span className={`font-mono ${marketData[selectedPair]?.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{marketData[selectedPair]?.change?.toFixed(5) || 'N/A'} ({marketData[selectedPair]?.changePercent?.toFixed(2) || '0.00'}%)</span></p>
                  <p>High (24h): <span className="font-mono text-slate-200">{marketData[selectedPair]?.high?.toFixed(5) || 'N/A'}</span></p>
                  <p>Low (24h): <span className="font-mono text-slate-200">{marketData[selectedPair]?.low?.toFixed(5) || 'N/A'}</span></p>
              </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-2 flex flex-col gap-6 sm:gap-8"
        >
          <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] order-1"
            >
              <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 sm:w-12 sm:h-12 mb-4 border-4 border-sky-400 border-t-transparent rounded-full"
                />
              <p className="text-lg sm:text-xl font-semibold text-sky-300">Analyzing Market Conditions...</p>
              <p className="text-xs sm:text-sm text-slate-400">Searching for signals on {selectedPair} ({selectedTimeframe})</p>
            </motion.div>
          )}
          </AnimatePresence>
          
          <AnimatePresence>
            {activeSignal && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="order-1" 
              >
                <SignalCard signal={activeSignal} />
              </motion.div>
            )}
          </AnimatePresence>

          {!activeSignal && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] text-center order-1"
            >
              <Zap size={32} sm:size={40} className="mb-3 text-slate-500"/>
              <p className="text-lg sm:text-xl font-semibold text-slate-400">Ready to find signals!</p>
              <p className="text-xs sm:text-sm text-slate-500">Select your pair & timeframe, then click "Start Analyzing".</p>
            </motion.div>
          )}

          <div className="bg-slate-800/70 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-2xl border border-slate-700 order-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-200 mb-3 flex items-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
              Price Chart <span className="text-xs sm:text-sm text-slate-400 ml-2">({selectedPair} - {selectedTimeframe})</span>
            </h2>
            {chartData.length > 0 ? (
              <TradingChart data={chartData} timeframe={selectedTimeframe} pair={selectedPair} />
            ) : (
              <div className="h-[250px] sm:h-[300px] flex flex-col items-center justify-center text-slate-500">
                <AlertTriangle size={32} className="mb-2"/>
                <p className="text-sm">Chart data will load here.</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
      
      <footer className="mt-8 pt-6 border-t border-slate-700/50 text-center">
        <a
          href="https://t.me/+AbjUQaTDgztjNzc9"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-3 mb-4 text-base font-medium text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-lg shadow-lg hover:shadow-sky-500/50 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <Send size={18} className="mr-2" />
          Want Proper Guidance & Signals? Join Our Telegram!
        </a>
        <p className="text-xs sm:text-sm text-slate-500">
          Binary Signal Pro &copy; {new Date().getFullYear()}. For educational purposes only. Trading involves risk.
        </p>
      </footer>
    </div>
  );
}

export default App;