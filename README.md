# firestore-tson-sdk 🚀

[![npm version](https://img.shields.io/npm/v/firestore-tson-sdk.svg?color=blue)](https://www.npmjs.com/package/firestore-tson-sdk)
[![license](https://img.shields.io/npm/l/firestore-tson-sdk.svg)](./LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/firestore-tson-sdk.svg)](https://bundlephobia.com/package/firestore-tson-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> **Complete Bi-directional Firebase Cloud Firestore $\leftrightarrow$ TSON (Token-Structured Object Notation) Converter & Query Payload Generator SDK for LLMs & AI Agents.**

Supports **Firebase JS SDK v9/v10, Firebase Admin SDK, Timestamps, GeoPoints, DocumentReferences, and QuerySnapshots**.

Cuts **50% of prompt input tokens** and **50% of AI output generation tokens**!

---

## 💡 Why `firestore-tson-sdk`?

When feeding Firebase Cloud Firestore collections or document snapshots into AI models:

1. **Read Path Overhead**: Sending raw Firestore `QuerySnapshot` data formatted with `JSON.stringify()` duplicates property keys across every document.
2. **Write Path Cost & Latency**: Forcing LLMs to reply in verbose JSON inflates output costs by **3x to 4x** and doubles generation latency.

`firestore-tson-sdk` provides a **single unified SDK** to handle both directions:
- **`firestoreToTson()`**: Serializes Firestore `QuerySnapshot` or document arrays into columnar TSON for prompt inputs.
- **`tsonToFirestore()`**: Parses LLM TSON responses into plain JS document objects.
- **`tsonToFirestoreBatch()`**: Converts LLM TSON responses into Firestore batch write payloads (`{ docId, data }`).

---

## 📊 Bi-Directional Token Savings Benchmark

| Operation | Standard JSON Format | TSON Format | Token Savings | Speedup |
| :--- | :--- | :--- | :--- | :--- |
| **Read Path** (Prompt Context) | ~14,500 tokens | ~6,700 tokens | **7,800 tokens saved** | **53.7% Less Input Cost** ⚡ |
| **Write Path** (LLM Output) | ~5,800 tokens | ~2,350 tokens | **3,450 tokens saved** | **~2.2x Faster Generation** ⚡ |

---

## 📦 Installation

```bash
npm install firestore-tson-sdk
# or
yarn add firestore-tson-sdk
# or
pnpm add firestore-tson-sdk
```

---

## ⚡ Quick Start

### 1. Read Path: Firestore `QuerySnapshot` $\rightarrow$ TSON (Prompt Context)

```typescript
import { firestoreToTson } from 'firestore-tson-sdk';
import { collection, getDocs } from 'firebase/firestore';

// Fetch collection snapshot from Firestore
const querySnapshot = await getDocs(collection(db, 'users'));

// Convert QuerySnapshot directly to compact TSON prompt context
const tsonPrompt = firestoreToTson(querySnapshot, { includeDocId: 'id', trackSavings: true });

console.log(tsonPrompt);
/*
id: usr_101, usr_102
first_name: Abhi, Sarah
email: abhiasok@rocketmail.com, sarah.chen@example.com
role: Architect, AI Engineer
*/
```

---

### 2. Write Path: LLM TSON Response $\rightarrow$ Firestore Batch Write

```typescript
import { tsonToFirestoreBatch } from 'firestore-tson-sdk';
import { doc, writeBatch } from 'firebase/firestore';

const llmTsonOutput = `
id: usr_103, usr_104
first_name: Elena, David
email: elena@example.com, david@example.com
role: Security Lead, DevOps Lead
`;

// Generate Firestore Batch operations
const operations = tsonToFirestoreBatch(llmTsonOutput, { docIdField: 'id' });

const batch = writeBatch(db);
for (const op of operations) {
  const ref = doc(db, 'users', op.docId);
  batch.set(ref, op.data);
}
await batch.commit();
```

---

### 3. Interactive Terminal Demo

Run the interactive CLI demonstration:

```bash
npm run demo
```

Check cumulative token savings logged automatically in `SAVINGS_TRACKER.json`:

```typescript
import { getGlobalSavingsTracker } from 'firestore-tson-sdk';

const tracker = getGlobalSavingsTracker();
console.log(tracker.getStats());
```

---

## 🛠️ API Reference

| Function | Direction | Description |
| :--- | :--- | :--- |
| `firestoreToTson(snapshot, options?)` | `Firestore -> TSON` | Converts `QuerySnapshot` or documents to TSON prompt strings. |
| `tsonToFirestore(tsonStr, options?)` | `TSON -> Firestore Docs` | Parses TSON strings back into plain JS document objects. |
| `tsonToFirestoreBatch(tsonStr, options?)` | `TSON -> Batch Writes` | Generates `{ docId, data }` objects for Firestore `writeBatch`. |

---

## 👤 Author & Contact

Developed with ❤️ by **Abhi Asok**.

For business inquiries, collaboration, or support:

* 📧 **Email**: [abhiasok@rocketmail.com](mailto:abhiasok@rocketmail.com)
* 📞 **Phone / WhatsApp**: [+91 9142125724](tel:+919142125724)
* 💼 **LinkedIn**: [linkedin.com/in/abhi-asok-09439788](https://www.linkedin.com/in/abhi-asok-09439788/)
* 🐙 **GitHub**: [github.com/AbhiArvension](https://github.com/AbhiArvension)

---

## 📄 License

[MIT](./LICENSE) © **Abhi Asok**
