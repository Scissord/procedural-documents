import { IUserData, IOpponentData } from '@interfaces';

export const DocumentValidationService = {
  async validateDocument(
    document_id: number,
    classification_id: number,
    role_id: number,
    stage_id: number,
    situation: string,
    court_name: string,
    court_address: string,
    case_number: string,
    price_of_claim: string,
    userData: IUserData,
    opponentData: IOpponentData,
  ): Promise<void> {
    if (
      !document_id ||
      !classification_id ||
      !role_id ||
      !stage_id ||
      !situation ||
      !court_name ||
      !court_address ||
      !case_number ||
      !price_of_claim ||
      !userData?.fullName ||
      !opponentData?.fullName
    ) {
      throw new Error('Invalid document data');
    }
  },

  sliceSituation(situation: string) {
    const maxSituationChars = 6000;
    return typeof situation === 'string' && situation.length > maxSituationChars
      ? `${situation.slice(0, maxSituationChars)}\n\n<<СИТУАЦИЯ СОКРАЩЕНА: пришёл слишком большой текст; укажи ключевые факты/даты/суммы/документы отдельно>>`
      : situation;
  },
};
