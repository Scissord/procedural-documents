export interface IGenerateDocumentRequest {
  document_id: number;
  classification_id: number;
  role_id: number;
  stage_id: number;
  situation: string;
  court_name: string;
  court_address: string;
  case_number: string;
  price_of_claim: string;
  userData: IUserData;
  opponentData: IOpponentData;
}

export interface IUserData {
  fullName: string;
  iin?: string;
  bin?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface IOpponentData {
  fullName: string;
  iin?: string;
  bin?: string;
  address?: string;
  phone: string;
  email: string;
  representative?: string;
}
