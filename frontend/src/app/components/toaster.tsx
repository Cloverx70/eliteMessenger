import React from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const toaster = (title: string, description?: string) => {
  return toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        exit={{ opacity: 0 }}
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-2">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Close
          </button>
        </div>
      </motion.div>
    ),
    { duration: 1000 }
  );
};

export default toaster;
