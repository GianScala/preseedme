// src/components/common/affiliate/index.ts
import { AFFILIATE_ONE_ADS } from "./affiliate_one/data";
import { AFFILIATE_TWO_ADS } from "./affiliate_two/data"; // Future proofing

// This flattens all your different affiliate folders into one master list
export const MASTER_AD_LIST = [
  ...AFFILIATE_ONE_ADS,
  ...AFFILIATE_TWO_ADS,
];