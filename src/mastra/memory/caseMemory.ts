// src/mastra/memory/caseMemory.ts

/**
 * CaseMemory: 書類照合AIエージェント用の共通メモリ
 *
 * 設計原則:
 * - エビデンス最優先: 抽出・照合されたすべての値は、必ず根拠（evidence）を参照する
 * - 暗黙的な破壊的変更をしない:
 *   - ログ（toolCalls / notes）は追記のみ
 *   - 正規化結果・比較結果・最終判定は「計算結果スナップショット」として明示的に上書き
 * - 事実と仮説を分離:
 *   - 事実は fields / comparisons / overall に記載
 *   - 推測・途中メモは analysisNotes に隔離
 */

export type UUID = string;

/** このエージェントが扱う書類種別 */
export type DocumentType = "registry" | "disclosure" | "unknown";

/** 各処理ステージの状態 */
export type StageStatus = "pending" | "running" | "done" | "failed";

/** 抽出・正規化結果の信頼度 */
export type Confidence = "high" | "medium" | "low" | "unknown";

/** 項目単位の照合結果 */
export type CompareResult = "MATCH" | "REVIEW" | "MISMATCH" | "NOT_FOUND";

/** ケース全体の最終判定 */
export type OverallStatus = "PASS" | "NEEDS_REVIEW" | "FAIL";

/** ログ等で個人情報をどの程度マスクするか */
export type RedactionLevel = "none" | "mask" | "remove";

/** 共通で使う日時フォーマット（ISO文字列） */
export type ISODateTime = string; // 例: new Date().toISOString()

/**
 * EvidenceRef:
 * 値がどこから抽出されたかを示す「証拠」への参照
 *
 * MVP段階では snippet（短い抜粋テキスト）のみでもOK。
 * 将来的に bbox（座標）やページ情報を追加し、UIでハイライト可能にする。
 */
export interface EvidenceRef {
  id: UUID;
  docId: UUID;
  pageNo?: number;
  /** 値を裏付ける短いテキスト抜粋 */
  snippet: string;
  /** OCR全文内での開始オフセット */
  startOffset?: number;
  /** OCR全文内での終了オフセット */
  endOffset?: number;
  /** レイアウト情報（OCRが座標を返す場合） */
  bbox?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    unit?: "px" | "ratio";
  }>;
}

/**
 * ToolCallLog:
 * OCR等のツール呼び出し履歴（監査用）
 *
 * ツールは「判断をしない」。
 * 事実（OCR結果など）だけを生成する。
 */
export interface ToolCallLog {
  id: UUID;
  toolName: string; // 例: "ocr.run", "storage.get", "docai.parse"
  startedAt: ISODateTime;
  finishedAt?: ISODateTime;
  status: StageStatus;
  /** リクエスト／レスポンスのメタ情報（秘密情報は含めない） */
  requestMeta?: Record<string, unknown>;
  responseMeta?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/** アップロードされた書類のメタ情報 */
export interface CaseDocument {
  docId: UUID;
  type: DocumentType;
  filename: string;
  mimeType: string;
  /** Supabase Storage / S3 上のパス */
  storagePath: string;
  uploadedAt: ISODateTime;
  uploadedBy?: string; // ユーザーID等
  /** 改ざん検知・再アップロード判定用ハッシュ */
  sha256?: string;
}

/**
 * OCRのページ単位結果
 */
export interface OcrPage {
  pageNo: number;
  text: string;
}

/**
 * OCR結果（書類単位）
 */
export interface OcrResult {
  docId: UUID;
  status: StageStatus;
  engine?: string; // 例: "gcv", "azure", "textract"
  startedAt?: ISODateTime;
  finishedAt?: ISODateTime;
  pages: OcrPage[];
  rawText: string;
  /** 推定言語 */
  language?: string; // "ja" 等
  /** エラーがあっても部分結果は保持する */
  error?: string;
}

/**
 * 抽出された値 + 根拠 + 信頼度
 */
export interface ExtractedValue {
  value?: string;
  confidence: Confidence;
  evidenceIds: UUID[];
  /** 複数候補がある場合 */
  candidates?: Array<{
    value: string;
    confidence: Confidence;
    evidenceIds: UUID[];
  }>;
  /** 住所分解などの構造化データ */
  structured?: Record<string, unknown>;
}

/**
 * MVPで扱う抽出項目一覧
 * ※ 将来拡張前提。最初は少数で良い。
 */
export interface ExtractedFields {
  // 人物
  ownerName?: ExtractedValue;        // 登記上の所有者氏名
  ownerAddress?: ExtractedValue;     // 登記上の所有者住所
  sellerName?: ExtractedValue;       // 重説上の売主氏名
  sellerAddress?: ExtractedValue;    // 重説上の売主住所

  // 物件識別情報
  propertyLocation?: ExtractedValue; // 所在地
  landLotNumber?: ExtractedValue;    // 地番
  houseNumber?: ExtractedValue;      // 家屋番号
  unitNumber?: ExtractedValue;       // 号室など

  // 補助情報
  propertyTypeHint?: ExtractedValue; // 土地 / 建物 / 区分など
}

/** 抽出処理の結果（書類単位） */
export interface ExtractionResult {
  docId: UUID;
  status: StageStatus;
  startedAt?: ISODateTime;
  finishedAt?: ISODateTime;
  fields: ExtractedFields;
  error?: string;
}

/**
 * 正規化後のスナップショット
 * 生値（raw）と正規化値（normalized）を分離して保持する
 */
export interface NormalizedFields {
  ownerName?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };
  ownerAddress?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };

  sellerName?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };
  sellerAddress?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };

  propertyLocation?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };
  landLotNumber?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };
  houseNumber?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };
  unitNumber?: { raw?: string; normalized?: string; confidence: Confidence; evidenceIds: UUID[] };

  /** 住所比較用のトークン分解結果 */
  tokens?: {
    addressRegistry?: Record<string, unknown>;
    addressDisclosure?: Record<string, unknown>;
  };
}

/** 正規化処理の結果 */
export interface NormalizationResult {
  status: StageStatus;
  startedAt?: ISODateTime;
  finishedAt?: ISODateTime;
  registry?: NormalizedFields;
  disclosure?: NormalizedFields;
  error?: string;
}

/**
 * 項目単位の照合結果
 */
export interface FieldComparison {
  field:
    | "ownerName"
    | "ownerAddress"
    | "propertyLocation"
    | "landLotNumber"
    | "houseNumber"
    | "unitNumber"
    | "sellerName"
    | "sellerAddress";
  result: CompareResult;
  /** 判定理由（業務向けに説明可能な文章） */
  reason: string;
  /** 類似度スコア（REVIEW判定の根拠） */
  score?: number; // 0..1
  /** 両書類の根拠への参照 */
  evidence: {
    registryEvidenceIds?: UUID[];
    disclosureEvidenceIds?: UUID[];
  };
}

/**
 * 最終的な業務判断
 */
export interface OverallDecision {
  status: OverallStatus;
  summary: string;
  humanChecks: Array<{
    title: string;
    detail: string;
    relatedFields?: FieldComparison["field"][];
    evidenceIds?: UUID[];
    severity?: "info" | "warning" | "critical";
  }>;
}

/**
 * 実行メタ情報（再実行・バージョン管理用）
 */
export interface RunMeta {
  runId: UUID;
  createdAt: ISODateTime;
  createdBy?: string;
  version: string; // 例: "caseMemory.v1"
  redactionLevel: RedactionLevel;
}

/**
 * CaseMemory:
 * すべてのエージェントが共有する唯一の真実（Single Source of Truth）
 */
export interface CaseMemory {
  meta: RunMeta;
  caseId: UUID;
  documents: CaseDocument[];

  /** 証拠プール（全文OCRは別で保持） */
  evidence: EvidenceRef[];

  /** ツール実行ログ */
  toolCalls: ToolCallLog[];

  /** 各ステージの結果 */
  ocr: OcrResult[];
  extractions: ExtractionResult[];
  normalization: NormalizationResult;

  comparisons: {
    status: StageStatus;
    startedAt?: ISODateTime;
    finishedAt?: ISODateTime;
    fields: FieldComparison[];
    error?: string;
  };

  overall: {
    status: StageStatus;
    decidedAt?: ISODateTime;
    decision?: OverallDecision;
    error?: string;
  };

  /** 推測・途中メモ（事実ではない） */
  analysisNotes: Array<{
    id: UUID;
    createdAt: ISODateTime;
    author: "master" | "extract" | "normalize" | "compare" | "judge" | string;
    note: string;
  }>;
}

/** ---- 初期化・補助関数 ---- */

export function createEmptyCaseMemory(params: {
  caseId: UUID;
  runId: UUID;
  createdAt?: ISODateTime;
  createdBy?: string;
  redactionLevel?: RedactionLevel;
  version?: string;
}): CaseMemory {
  const now = params.createdAt ?? new Date().toISOString();

  return {
    meta: {
      runId: params.runId,
      createdAt: now,
      createdBy: params.createdBy,
      version: params.version ?? "caseMemory.v1",
      redactionLevel: params.redactionLevel ?? "none",
    },
    caseId: params.caseId,
    documents: [],
    evidence: [],
    toolCalls: [],
    ocr: [],
    extractions: [],
    normalization: { status: "pending" },
    comparisons: { status: "pending", fields: [] },
    overall: { status: "pending" },
    analysisNotes: [],
  };
}

/** 証拠を追加してIDを返す */
export function addEvidence(
  memory: CaseMemory,
  ev: Omit<EvidenceRef, "id"> & { id?: UUID }
): UUID {
  const id = ev.id ?? cryptoRandomId();
  memory.evidence.push({ ...ev, id });
  return id;
}

/** ツール呼び出しログを追加 */
export function addToolCall(
  memory: CaseMemory,
  log: Omit<ToolCallLog, "id"> & { id?: UUID }
): UUID {
  const id = log.id ?? cryptoRandomId();
  memory.toolCalls.push({ ...log, id });
  return id;
}

/** ID生成ユーティリティ */
export function cryptoRandomId(): UUID {
  const g: any = globalThis as any;
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
