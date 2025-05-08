"use client";
import { useContext } from 'react';
import { DataProvider, useData as useDataContextHook } from '@/contexts/data-context'; // adjust path if DataProvider is not directly exported here

export { useDataContextHook as useData };