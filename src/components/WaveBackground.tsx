import { motion } from "framer-motion";

interface WaveBackgroundProps {
  variant?: 'default' | 'investments' | 'dashboard';
}

const WaveBackground = ({ variant = 'default' }: WaveBackgroundProps) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.g
          opacity="0.4"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M0 200C320 120 640 280 960 200C1280 120 1600 280 1920 200V1080H0V200Z" fill="hsl(var(--primary) / 0.15)"/>
        </motion.g>
        <motion.g
          opacity="0.3"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <path d="M0 350C400 250 800 450 1200 350C1600 250 1920 400 1920 400V1080H0V350Z" fill="hsl(var(--primary) / 0.12)"/>
        </motion.g>
        <motion.g
          opacity="0.2"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        >
          <path d="M0 500C480 400 960 600 1440 500C1920 400 1920 550 1920 550V1080H0V500Z" fill="hsl(var(--primary) / 0.08)"/>
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default WaveBackground;
