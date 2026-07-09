import React, { useState, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { differenceInMilliseconds } from 'date-fns';

interface DissolvingItemProps extends HTMLMotionProps<"div"> {
  expiresAt: string;
  children: React.ReactNode;
}

export function DissolvingItem({ expiresAt, children, ...props }: DissolvingItemProps) {
  const [isDissolving, setIsDissolving] = useState(false);

  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = differenceInMilliseconds(expiry, now);

      // Start dissolving 60 seconds before expiration
      if (diffMs <= 60000 && diffMs > 0) {
        setIsDissolving(true);
      } else if (diffMs > 60000) {
        // Schedule a timeout to start dissolving
        const timeout = setTimeout(() => {
          setIsDissolving(true);
        }, diffMs - 60000);
        return () => clearTimeout(timeout);
      } else if (diffMs <= 0) {
        setIsDissolving(true);
      }
    };

    checkExpiration();
    // Check periodically in case browser sleeps
    const int = setInterval(checkExpiration, 10000);
    return () => clearInterval(int);
  }, [expiresAt]);

  return (
    <motion.div
      {...props}
      animate={isDissolving ? { 
        opacity: [1, 0.5, 0], 
        filter: ['blur(0px)', 'blur(4px)', 'blur(10px)'],
        scale: [1, 0.98, 0.95],
        transition: { duration: 60, ease: "linear" } 
      } : props.animate}
    >
      {children}
    </motion.div>
  );
}
