import { PartyParseSummary } from './common';
import { parseSunFile } from './sunParser';
import { parseRpFile } from './rpParser';
import { parseDwarikaFile } from './dwarikaParser';
import { parseNagdaFile } from './nagdaParser';
import { parseModiFile } from './modiParser';
import { parseVardhmanFile } from './vardhmanParser';
import { parsePrimaryFile } from './primaryParser';

export * from './common';
export * from './primaryParser';

export async function parsePartyFile(partyId: string, partyName: string, file: File): Promise<PartyParseSummary> {
  switch (partyId.toLowerCase()) {
    case 'primary':
      return await parsePrimaryFile(file, partyName);
    case 'sun':
      return await parseSunFile(file, partyName);
    case 'rp':
      return await parseRpFile(file, partyName);
    case 'dwarika':
      return await parseDwarikaFile(file, partyName);
    case 'nagda':
      return await parseNagdaFile(file, partyName);
    case 'modi':
      return await parseModiFile(file, partyName);
    case 'vardhman':
      return await parseVardhmanFile(file, partyName);
    default:
      if (partyId.includes('primary')) return await parsePrimaryFile(file, partyName);
      if (partyId.includes('sun')) return await parseSunFile(file, partyName);
      if (partyId.includes('rp')) return await parseRpFile(file, partyName);
      if (partyId.includes('dwarika')) return await parseDwarikaFile(file, partyName);
      if (partyId.includes('nagda')) return await parseNagdaFile(file, partyName);
      if (partyId.includes('modi')) return await parseModiFile(file, partyName);
      return await parseVardhmanFile(file, partyName);
  }
}
