export interface SearchEventResultDTO {
  id: string;
  name: string;
  startAt: string;
  eventType: string;
  targetUrl: string;
}

export interface SearchTaskResultDTO {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  targetUrl: string;
}

export interface SearchGuestResultDTO {
  id: string;
  name: string;
  side?: string;
  memberCount: number;
  rsvpStatus?: string;
  targetUrl: string;
}

export interface SearchVendorResultDTO {
  id: string;
  name: string;
  category: string;
  status: string;
  targetUrl: string;
}

export interface SearchExpenseResultDTO {
  id: string;
  title: string;
  amountPaise: number;
  status: string;
  targetUrl: string;
}

export interface SearchDocumentResultDTO {
  id: string;
  title: string;
  fileType: string;
  mimeType?: string;
  targetUrl: string;
}

export interface SearchResultsDTO {
  events: SearchEventResultDTO[];
  tasks: SearchTaskResultDTO[];
  guests: SearchGuestResultDTO[];
  vendors: SearchVendorResultDTO[];
  expenses: SearchExpenseResultDTO[];
  documents: SearchDocumentResultDTO[];
}

export interface SearchResponseDTO {
  query: string;
  totalMatches: number;
  results: SearchResultsDTO;
}
