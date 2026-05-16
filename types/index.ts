export interface RawRechtspraakItem {
  ecli: string;
  titel: string;
  instantie: string;
  datum: string;
  samenvatting: string;
  url: string;
  bron: 'rechtspraak';
}

export interface RawTuchbrechtItem {
  identifier: string;
  titel: string;
  instantie: string;
  datum: string;
  tekst: string;
  url: string;
  bron: 'tuchtrecht';
}

export type RawItem = RawRechtspraakItem | RawTuchbrechtItem;

export interface DigestItem {
  id: string;
  titel: string;
  headline: string;
  instantie: string;
  datum: string;
  feiten: string;
  oordeel: string;
  relevantie: string;
  les: string;
  categorie: LesCategorie;
  url: string;
  bron: 'rechtspraak' | 'tuchtrecht';
}

export interface LesBron {
  id: string;
  headline: string;
  datum: string;
  url: string;
}

export type LesCategorie =
  | 'Schikkingsadvies'
  | 'Vaststellingsovereenkomst'
  | 'Onderhandelingen'
  | 'Hoedanigheid advocaat'
  | 'Overig';

export interface Les {
  tekst: string;
  categorie: LesCategorie;
  bronnen: LesBron[];
}

export interface LessenStore {
  aanvangsDatum: string;
  bijgewerkt: string;
  lessen: Les[];
}

export interface DigestResponse {
  items: DigestItem[];
  lessen: Les[];
  lessenAanvangsDatum?: string;
  ophaalDatum: string;
  periodeVan: string;
  periodeTot: string;
  aantalRuw: number;
  fout?: string;
}
