"use client";

import { createContext, useContext } from "react";

const PageReadyContext = createContext(false);

export const PageReadyProvider = PageReadyContext.Provider;

export const usePageReady = () => useContext(PageReadyContext);
