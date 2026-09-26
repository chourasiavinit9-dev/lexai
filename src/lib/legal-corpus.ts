
export interface LegalProvision {
  readonly act: string;
  readonly shortName: string;
  readonly section?: string;
  readonly article?: string;
  readonly heading: string;
  readonly text: string;
  readonly effectiveDate: string;
  readonly source: string;
  readonly tags: string[];
}

/** Curated authoritative provisions from key Indian statutes.
 *  Source: Legislative Department, Government of India / India Code.
 *  This corpus covers the provisions most commonly encountered in
 *  everyday contracts and legal documents. */
export const LEGAL_CORPUS: LegalProvision[] = [

  // ══════════════════════════════════════════════════════════════
  // CONSTITUTION OF INDIA — PART III (FUNDAMENTAL RIGHTS)
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Constitution of India',
    shortName: 'Constitution',
    article: '14',
    heading: 'Equality before law',
    text: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
    effectiveDate: '1950-01-26',
    source: 'Constitution of India, Part III — Legislative Department, Government of India',
    tags: ['equality', 'discrimination', 'state action', 'fundamental rights'],
  },
  {
    act: 'Constitution of India',
    shortName: 'Constitution',
    article: '19',
    heading: 'Protection of certain rights regarding freedom of speech, etc.',
    text: '(1) All citizens shall have the right— (a) to freedom of speech and expression; (b) to assemble peaceably and without arms; (c) to form associations or unions or co-operative societies; (d) to move freely throughout the territory of India; (e) to reside and settle in any part of the territory of India; and (g) to practise any profession, or to carry on any occupation, trade or business.',
    effectiveDate: '1950-01-26',
    source: 'Constitution of India, Part III — Legislative Department, Government of India',
    tags: ['freedom', 'profession', 'trade', 'occupation', 'non-compete', 'restraint of trade'],
  },
  {
    act: 'Constitution of India',
    shortName: 'Constitution',
    article: '19(1)(g)',
    heading: 'Right to practise any profession or carry on any occupation, trade or business',
    text: 'All citizens shall have the right to practise any profession, or to carry on any occupation, trade or business. This right may be restricted by law in the interests of the general public.',
    effectiveDate: '1950-01-26',
    source: 'Constitution of India, Article 19(1)(g) — Legislative Department, Government of India',
    tags: ['profession', 'trade', 'business', 'non-compete', 'restraint'],
  },
  {
    act: 'Constitution of India',
    shortName: 'Constitution',
    article: '21',
    heading: 'Protection of life and personal liberty',
    text: 'No person shall be deprived of his life or personal liberty except according to procedure established by law.',
    effectiveDate: '1950-01-26',
    source: 'Constitution of India, Part III — Legislative Department, Government of India',
    tags: ['life', 'liberty', 'dignity', 'privacy', 'personal liberty'],
  },
  {
    act: 'Constitution of India',
    shortName: 'Constitution',
    article: '23',
    heading: 'Prohibition of traffic in human beings and forced labour',
    text: '(1) Traffic in human beings and begar and other similar forms of forced labour are prohibited and any contravention of this provision shall be an offence punishable in accordance with law.',
    effectiveDate: '1950-01-26',
    source: 'Constitution of India, Part III — Legislative Department, Government of India',
    tags: ['forced labour', 'begar', 'human trafficking'],
  },
  {
    act: 'Constitution of India',
    shortName: 'Constitution',
    article: '300A',
    heading: 'Persons not to be deprived of property save by authority of law',
    text: 'No person shall be deprived of his property save by authority of law.',
    effectiveDate: '1978-06-20',
    source: 'Constitution of India — Legislative Department, Government of India',
    tags: ['property', 'deprivation', 'law'],
  },

  // ══════════════════════════════════════════════════════════════
  // INDIAN CONTRACT ACT, 1872
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '10',
    heading: 'What agreements are contracts',
    text: 'All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code, Legislative Department',
    tags: ['contract', 'agreement', 'consent', 'consideration', 'competent'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '13',
    heading: '"Consent" defined',
    text: 'Two or more persons are said to consent when they agree upon the same thing in the same sense.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['consent', 'agreement'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '14',
    heading: '"Free consent" defined',
    text: 'Consent is said to be free when it is not caused by— (1) coercion, as defined in section 15, or (2) undue influence, as defined in section 16, or (3) fraud, as defined in section 17, or (4) misrepresentation, as defined in section 18, or (5) mistake, subject to the provisions of sections 20, 21 and 22.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['free consent', 'coercion', 'fraud', 'misrepresentation', 'mistake'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '23',
    heading: 'What considerations and objects are lawful, and what not',
    text: 'The consideration or object of an agreement is lawful, unless— it is forbidden by law; or is of such a nature that, if permitted, it would defeat the provisions of any law; or is fraudulent; or involves or implies, injury to the person or property of another; or the Court regards it as immoral, or opposed to public policy.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['public policy', 'unlawful', 'void', 'object', 'consideration'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '27',
    heading: 'Agreement in restraint of trade, void',
    text: 'Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void. Exception 1: Saving of agreement not to carry on business of which good-will is sold. One who sells the good-will of a business may agree with the buyer to refrain from carrying on a similar business, within specified local limits, so long as the buyer, or any person deriving title to the good-will from him, carries on a like business therein, provided that such limits appear to the Court reasonable, regard being had to the nature of the business.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['restraint of trade', 'non-compete', 'void', 'profession', 'business'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '28',
    heading: 'Agreements in restraint of legal proceedings, void',
    text: 'Every agreement, by which any party thereto is restricted absolutely from enforcing his rights under or in respect of any contract, by the usual legal proceedings in the ordinary tribunals, or which limits the time within which he may thus enforce his rights, is void to that extent.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['legal proceedings', 'arbitration', 'limitation', 'void'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '56',
    heading: 'Agreement to do impossible act',
    text: 'An agreement to do an act impossible in itself is void. A contract to do an act which, after the contract is made, becomes impossible, or, by reason of some event which the promisor could not prevent, unlawful, becomes void when the act becomes impossible or unlawful.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['frustration', 'impossibility', 'force majeure', 'void'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '73',
    heading: 'Compensation for loss or damage caused by breach of contract',
    text: 'When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken it, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['breach', 'compensation', 'damages', 'loss'],
  },
  {
    act: 'Indian Contract Act, 1872',
    shortName: 'ICA',
    section: '74',
    heading: 'Compensation for breach of contract where penalty stipulated for',
    text: 'When a contract has been broken, if a sum is named in the contract as the amount to be paid in case of such breach, or if the contract contains any other stipulation by way of penalty, the party complaining of the breach is entitled, whether or not actual damage or loss is proved to have been caused thereby, to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named or, as the case may be, the penalty stipulated for.',
    effectiveDate: '1872-09-01',
    source: 'Indian Contract Act, 1872 — India Code',
    tags: ['penalty', 'liquidated damages', 'breach', 'compensation'],
  },

  // ══════════════════════════════════════════════════════════════
  // BHARATIYA NYAYA SANHITA, 2023 (BNS) — KEY SECTIONS
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '4',
    heading: 'Punishments',
    text: 'The punishments to which offenders are liable under the provisions of this Sanhita are: (a) Death; (b) Imprisonment for life; (c) Imprisonment, which is of two descriptions, namely: (i) rigorous, with hard labour; (ii) simple; (d) Forfeiture of property; (e) Fine; (f) Community Service.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code, Ministry of Law and Justice',
    tags: ['punishment', 'offence', 'criminal', 'sentence'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '61',
    heading: 'Criminal conspiracy',
    text: 'When two or more persons agree to do, or cause to be done,— (1) an illegal act, or (2) an act which is not illegal by illegal means, such an agreement is designated a criminal conspiracy: Provided that no agreement except an agreement to commit an offence shall amount to a criminal conspiracy unless some act besides the agreement is done by one or more parties to such agreement in pursuance thereof.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['conspiracy', 'criminal', 'agreement', 'illegal'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '84',
    heading: 'Cheating',
    text: 'Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything which he would not do or omit if he were not so deceived, and which act or omission causes or is likely to cause damage or harm to that person in body, mind, reputation or property, is said to "cheat".',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['cheating', 'fraud', 'deception', 'property', 'dishonest'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '85',
    heading: 'Cheating by personation',
    text: 'A person is said to "cheat by personation" if he cheats by pretending to be some other person, or by knowingly substituting one person for another, or representing that he or any other person is a person other than he or such other person really is.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['cheating', 'personation', 'impersonation', 'identity'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '103',
    heading: 'Murder',
    text: 'Except in the cases hereinafter excepted, culpable homicide is murder, if the act by which the death is caused is done with the intention of causing death, or if it is done with the intention of causing such bodily injury as the offender knows to be likely to cause the death of the person to whom the harm is caused, or if it is done with the intention of causing bodily injury to any person and the bodily injury intended to be inflicted is sufficient in the ordinary course of nature to cause death, or if the person committing the act knows that it is so imminently dangerous that it must, in all probability, cause death or such bodily injury as is likely to cause death.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code, Ministry of Law and Justice',
    tags: ['murder', 'culpable homicide', 'death', 'intention', 'criminal'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '105',
    heading: 'Culpable homicide not amounting to murder',
    text: 'Culpable homicide is not murder if it is committed— (a) without premeditation in a sudden fight in the heat of passion upon a sudden quarrel and without the offender having taken undue advantage or acted in a cruel or unusual manner; (b) by a person who, in good faith, exercises the right of private defence of person or property, but has exceeded his power given to him by law and has caused death without any intention of causing it and without any knowledge that it is likely to cause death.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['culpable homicide', 'manslaughter', 'provocation', 'private defence'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '115',
    heading: 'Voluntarily causing hurt',
    text: 'Whoever does any act with the intention of thereby causing hurt to any person, or with the knowledge that he is likely thereby to cause hurt to any person, and does thereby cause hurt to any person, is said "voluntarily to cause hurt".',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['hurt', 'bodily harm', 'injury', 'intention'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '140',
    heading: 'Kidnapping',
    text: 'Kidnapping is of two kinds: kidnapping from India, and kidnapping from lawful guardianship. Whoever conveys any person beyond the limits of India without the consent of that person, or of some person legally authorised to consent on behalf of that person, is said to kidnap that person from India. Whoever takes or entices any minor under sixteen years of age if a male, or under eighteen years of age if a female, or any person of unsound mind, out of the keeping of the lawful guardian of such minor or person of unsound mind, without the consent of such guardian, is said to kidnap such minor or person from lawful guardianship.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['kidnapping', 'abduction', 'minor', 'guardian'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '303',
    heading: 'Theft',
    text: 'Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person\'s consent, moves that property in order to such taking, is said to commit theft.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['theft', 'moveable property', 'dishonest', 'possession'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '351',
    heading: 'Criminal intimidation',
    text: 'Whoever threatens another with any injury to his person, reputation or property, or to the person or reputation of any one in whom that person is interested, with intent to cause alarm to that person, or to cause that person to do any act which he is not legally bound to do, or to omit to do any act which that person is legally entitled to do, as the means of avoiding the execution of such threat, commits criminal intimidation.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['intimidation', 'threat', 'coercion', 'alarm'],
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    shortName: 'BNS',
    section: '316',
    heading: 'Criminal breach of trust',
    text: 'Whoever, being in any manner entrusted with property, or with any dominion over property, dishonestly misappropriates or converts to his own use that property, or dishonestly uses or disposes of that property in violation of any direction of law prescribing the mode in which such trust is to be discharged, or of any legal contract, express or implied, which he has made touching the discharge of such trust, or wilfully suffers any other person so to do, commits "criminal breach of trust".',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nyaya Sanhita, 2023 — India Code',
    tags: ['breach of trust', 'misappropriation', 'fiduciary', 'property'],
  },

  // ══════════════════════════════════════════════════════════════
  // BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (BNSS)
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    shortName: 'BNSS',
    section: '2',
    heading: 'Definitions (selected)',
    text: '(1) In this Sanhita, unless the context otherwise requires,— (a) "bailable offence" means an offence shown as bailable in the First Schedule or which is made bailable by any other law for the time being in force, and "non-bailable offence" means any other offence; (b) "charge" includes any head of charge when the charge contains more heads than one; (c) "cognizable offence" means an offence for which, and "cognizable case" means a case in which, a police officer may, in accordance with the First Schedule or under any other law for the time being in force, arrest without warrant.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nagarik Suraksha Sanhita, 2023 — India Code',
    tags: ['BNSS', 'bailable', 'non-bailable', 'cognizable', 'procedure', 'criminal procedure'],
  },
  {
    act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    shortName: 'BNSS',
    section: '35',
    heading: 'Arrest how made',
    text: 'In making an arrest the police officer or other person making the same shall actually touch or confine the body of the person to be arrested, unless there be a submission to the custody by word or action.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nagarik Suraksha Sanhita, 2023 — India Code',
    tags: ['arrest', 'police', 'custody', 'procedure'],
  },
  {
    act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    shortName: 'BNSS',
    section: '173',
    heading: 'Information in cognizable cases',
    text: 'Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant; and every such information, whether given in writing or reduced to writing as aforesaid, shall be signed by the person giving it, and the substance thereof shall be entered in a book to be kept by such officer.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Nagarik Suraksha Sanhita, 2023 — India Code',
    tags: ['FIR', 'first information report', 'cognizable', 'police station'],
  },

  // ══════════════════════════════════════════════════════════════
  // BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA)
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Bharatiya Sakshya Adhiniyam, 2023',
    shortName: 'BSA',
    section: '2',
    heading: 'Definitions (selected)',
    text: '(1) In this Adhiniyam, unless the context otherwise requires,— (a) "court" includes all Judges and Magistrates, and all persons, except arbitrators, legally authorised to take evidence; (b) "document" means any matter expressed or described upon any substance by means of letters, figures or marks, or by more than one of those means, intended to be used, or which may be used, for the purpose of recording that matter.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Sakshya Adhiniyam, 2023 — India Code',
    tags: ['BSA', 'evidence', 'document', 'court', 'judge'],
  },
  {
    act: 'Bharatiya Sakshya Adhiniyam, 2023',
    shortName: 'BSA',
    section: '57',
    heading: 'Burden of proof',
    text: 'Whoever desires any court to give judgment as to any legal right or liability dependent on the existence of facts which he asserts, must prove that those facts exist.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Sakshya Adhiniyam, 2023 — India Code',
    tags: ['burden of proof', 'evidence', 'facts', 'judgment'],
  },
  {
    act: 'Bharatiya Sakshya Adhiniyam, 2023',
    shortName: 'BSA',
    section: '63',
    heading: 'Electronic records',
    text: 'The contents of electronic records may be proved in accordance with the provisions of section 63A.',
    effectiveDate: '2024-07-01',
    source: 'Bharatiya Sakshya Adhiniyam, 2023 — India Code',
    tags: ['electronic records', 'digital evidence', 'e-evidence'],
  },

  // ══════════════════════════════════════════════════════════════
  // CONSUMER PROTECTION ACT, 2019
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Consumer Protection Act, 2019',
    shortName: 'CPA',
    section: '2(9)',
    heading: '"Consumer" defined',
    text: '"consumer" means any person who— (i) buys any goods for a consideration which has been paid or promised or partly paid and partly promised, or under any system of deferred payment and includes any user of such goods other than the person who buys such goods for consideration paid or promised or partly paid or partly promised, or under any system of deferred payment, when such use is made with the approval of such person, but does not include a person who obtains such goods for resale or for any commercial purpose.',
    effectiveDate: '2019-07-20',
    source: 'Consumer Protection Act, 2019 — India Code',
    tags: ['consumer', 'goods', 'services', 'buyer', 'definition'],
  },
  {
    act: 'Consumer Protection Act, 2019',
    shortName: 'CPA',
    section: '2(46)',
    heading: '"Unfair contract" defined',
    text: '"unfair contract" means a contract between a manufacturer or trader or service provider on one hand, and a consumer on the other, having such terms which cause significant change in the rights of such consumer, including the following, namely:— (i) requiring manifestly excessive security deposits to be given by a consumer for the performance of contractual obligations; (ii) imposing any penalty on the consumer for the breach of contract thereof which is wholly disproportionate to the loss occurred due to such breach; (iii) refusing to accept early repayment of debts on payment of applicable penalty; (iv) entitling a party to terminate such contract without reasonable cause; (v) permitting or has the effect of permitting one party to assign the contract to the detriment of the other party who is a consumer, without his consent.',
    effectiveDate: '2019-07-20',
    source: 'Consumer Protection Act, 2019 — India Code',
    tags: ['unfair contract', 'consumer rights', 'one-sided', 'penalty', 'security deposit'],
  },
  {
    act: 'Consumer Protection Act, 2019',
    shortName: 'CPA',
    section: '49',
    heading: 'Unfair contracts',
    text: 'The State Commission shall have the jurisdiction to entertain complaints against unfair contracts, where the value of goods or services paid as consideration exceeds one crore rupees.',
    effectiveDate: '2019-07-20',
    source: 'Consumer Protection Act, 2019 — India Code',
    tags: ['unfair contract', 'state commission', 'consumer forum', 'remedies'],
  },

  // ══════════════════════════════════════════════════════════════
  // TRANSFER OF PROPERTY ACT, 1882 (for lease/rent)
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Transfer of Property Act, 1882',
    shortName: 'TPA',
    section: '105',
    heading: 'Lease defined',
    text: 'A lease of immoveable property is a transfer of a right to enjoy such property, made for a certain time, express or implied, or in perpetuity, in consideration of a price paid or promised, or of money, a share of crops, service or any other thing of value, to be rendered periodically or on specified occasions to the transferor by the transferee, who accepts the transfer on such terms.',
    effectiveDate: '1882-02-17',
    source: 'Transfer of Property Act, 1882 — India Code',
    tags: ['lease', 'rent', 'property', 'landlord', 'tenant', 'immoveable'],
  },
  {
    act: 'Transfer of Property Act, 1882',
    shortName: 'TPA',
    section: '108',
    heading: 'Rights and liabilities of lessor and lessee',
    text: 'In the absence of a contract or local law or usage to the contrary, the lessor and the lessee of immoveable property, as against one another, shall possess the following rights and be subject to the following liabilities: The lessor is bound to disclose to the lessee any material defect in the property, with reference to its intended use, of which the lessor is and the lessee is not aware.',
    effectiveDate: '1882-02-17',
    source: 'Transfer of Property Act, 1882 — India Code',
    tags: ['lease', 'landlord obligations', 'tenant rights', 'defect', 'quiet enjoyment'],
  },

  // ══════════════════════════════════════════════════════════════
  // SPECIFIC RELIEF ACT, 1963
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Specific Relief Act, 1963',
    shortName: 'SRA',
    section: '10',
    heading: 'Cases in which specific performance of contract enforceable',
    text: 'Except as otherwise provided in this Chapter, the specific performance of a contract shall be enforced by the court subject to the provisions contained in sub-section (2) of section 11, section 14 and section 16.',
    effectiveDate: '1963-10-13',
    source: 'Specific Relief Act, 1963 — India Code',
    tags: ['specific performance', 'contract', 'enforcement', 'court'],
  },

  // ══════════════════════════════════════════════════════════════
  // INFORMATION TECHNOLOGY ACT, 2000
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Information Technology Act, 2000',
    shortName: 'IT Act',
    section: '65B',
    heading: 'Admissibility of electronic records',
    text: 'Notwithstanding anything contained in this Act, any information contained in an electronic record which is printed on a paper, stored, recorded or copied in optical or magnetic media produced by a computer shall be deemed to be also a document, if the conditions mentioned in this section are satisfied in relation to the information and computer in question and shall be admissible in any proceedings, without further proof or production of the original, as evidence of any contents of the original or of any fact stated therein of which direct evidence would be admissible.',
    effectiveDate: '2000-06-09',
    source: 'Information Technology Act, 2000 — India Code',
    tags: ['electronic record', 'digital', 'admissibility', 'evidence', 'computer'],
  },

  // ══════════════════════════════════════════════════════════════
  // ARBITRATION AND CONCILIATION ACT, 1996
  // ══════════════════════════════════════════════════════════════
  {
    act: 'Arbitration and Conciliation Act, 1996',
    shortName: 'Arbitration Act',
    section: '7',
    heading: 'Arbitration agreement',
    text: '(1) In this Part, "arbitration agreement" means an agreement by the parties to submit to arbitration all or certain disputes which have arisen or which may arise between them in respect of a defined legal relationship, whether contractual or not. (2) An arbitration agreement may be in the form of an arbitration clause in a contract or in the form of a separate agreement. (3) An arbitration agreement shall be in writing.',
    effectiveDate: '1996-08-16',
    source: 'Arbitration and Conciliation Act, 1996 — India Code',
    tags: ['arbitration', 'dispute resolution', 'agreement', 'clause'],
  },
];

/** Normalize a search term for matching */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

export interface RetrievalResult {
  readonly provision: LegalProvision;
  readonly matchType: 'exact_section' | 'exact_article' | 'act_match' | 'keyword';
  readonly confidence: 'high' | 'medium' | 'low';
}

/** Search the corpus for provisions matching the query */
export function retrieveProvisions(query: string): RetrievalResult[] {
  const q = normalize(query);
  const results: RetrievalResult[] = [];

  for (const provision of LEGAL_CORPUS) {
    // Exact section/article match
    const secRef = provision.section ? `section ${provision.section}` : '';
    const artRef = provision.article ? `article ${provision.article}` : '';

    if (secRef && q.includes(secRef)) {
      const actName = normalize(provision.shortName);
      const confidence = q.includes(actName) ? 'high' : 'medium';
      results.push({ provision, matchType: 'exact_section', confidence });
      continue;
    }
    if (artRef && q.includes(artRef)) {
      results.push({ provision, matchType: 'exact_article', confidence: 'high' });
      continue;
    }
    // Act name match
    const actNorm = normalize(provision.act);
    const shortNorm = normalize(provision.shortName);
    if (q.includes(actNorm) || q.includes(shortNorm)) {
      results.push({ provision, matchType: 'act_match', confidence: 'medium' });
      continue;
    }
    // Keyword match (at least 2 tags)
    const tagMatches = provision.tags.filter(t => q.includes(normalize(t)));
    if (tagMatches.length >= 2) {
      results.push({ provision, matchType: 'keyword', confidence: 'low' });
    }
  }

  // Sort: exact > act > keyword, then high > medium > low
  const order = { exact_section: 0, exact_article: 0, act_match: 1, keyword: 2 };
  const conf  = { high: 0, medium: 1, low: 2 };
  return results.sort((a, b) =>
    order[a.matchType] - order[b.matchType] || conf[a.confidence] - conf[b.confidence]
  ).slice(0, 6);
}

/** Retrieve by specific section */
export function retrieveSection(shortName: string, section: string): LegalProvision | undefined {
  return LEGAL_CORPUS.find(
    p => normalize(p.shortName) === normalize(shortName) && p.section === section
  );
}

/** Retrieve by specific article (Constitution) */
export function retrieveArticle(article: string): LegalProvision | undefined {
  const norm = article.replace(/\s+/g, '').toLowerCase();
  return LEGAL_CORPUS.find(p => p.article?.replace(/\s+/g, '').toLowerCase() === norm);
}
