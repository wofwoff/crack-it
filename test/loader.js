import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const parentURL = context.parentURL || pathToFileURL(process.cwd() + '/').href;
    const resolvedURL = new URL(specifier, parentURL);
    let filePath = fileURLToPath(resolvedURL.href);

    // If it exists exactly as is
    if (existsSync(filePath)) {
      return {
        url: resolvedURL.href,
        shortCircuit: true,
      };
    }

    // Try adding .js
    if (existsSync(filePath + '.js')) {
      return {
        url: resolvedURL.href + '.js',
        shortCircuit: true,
      };
    }

    // Try adding .jsx
    if (existsSync(filePath + '.jsx')) {
      return {
        url: resolvedURL.href + '.jsx',
        shortCircuit: true,
      };
    }

    // Try adding .json
    if (existsSync(filePath + '.json')) {
      return {
        url: resolvedURL.href + '.json',
        shortCircuit: true,
      };
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  // Intercept CSS imports
  if (url.endsWith('.css') || url.includes('.css?')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {};',
    };
  }

  // Intercept content.js for testing
  if (url.endsWith('src/content.js') || url.endsWith('src/content')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        export const QUESTIONS = new Proxy([], {
          get(target, prop) {
            const list = globalThis.__mockQuestions || [];
            if (prop === 'length') return list.length;
            if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
            const val = list[prop];
            if (typeof val === 'function') return val.bind(list);
            return val;
          }
        });
        export const DSA_PROMPTS = new Proxy([], {
          get(target, prop) {
            const list = globalThis.__mockDsaPrompts || [];
            if (prop === 'length') return list.length;
            if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
            const val = list[prop];
            if (typeof val === 'function') return val.bind(list);
            return val;
          }
        });
        export const INTERACTIVE_QUESTIONS = new Proxy([], {
          get(target, prop) {
            const list = globalThis.__mockInteractiveQuestions || [];
            if (prop === 'length') return list.length;
            if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
            const val = list[prop];
            if (typeof val === 'function') return val.bind(list);
            return val;
          }
        });
      `,
    };
  }

  // Intercept cheatsheets.js for testing
  if (url.endsWith('src/cheatsheets.js') || url.endsWith('src/cheatsheets')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        export const CHEATSHEETS = new Proxy({}, {
          get(target, prop) {
            const obj = globalThis.__mockCheatsheets || {};
            const val = obj[prop];
            if (typeof val === 'function') return val.bind(obj);
            return val;
          }
        });
      `,
    };
  }

  // Intercept llm.js for testing
  if (url.endsWith('src/llm.js') || url.endsWith('src/llm')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        export const generateApplicationInterviewQuestions = (...args) => {
          if (globalThis.__mockLlm?.generateApplicationInterviewQuestions) {
            return globalThis.__mockLlm.generateApplicationInterviewQuestions(...args);
          }
          return Promise.resolve([]);
        };
        export const gradeDsaAnswer = (...args) => {
          if (globalThis.__mockLlm?.gradeDsaAnswer) {
            return globalThis.__mockLlm.gradeDsaAnswer(...args);
          }
          return Promise.resolve({ passed: true, score: 5, feedback: 'Mock feedback' });
        };
        export const explainDsaMistake = (...args) => {
          if (globalThis.__mockLlm?.explainDsaMistake) {
            return globalThis.__mockLlm.explainDsaMistake(...args);
          }
          return Promise.resolve('Mock explanation');
        };
        export const followUpQuestion = (...args) => {
          if (globalThis.__mockLlm?.followUpQuestion) {
            return globalThis.__mockLlm.followUpQuestion(...args);
          }
          return Promise.resolve('Mock follow-up');
        };
        export const isAiConfigured = () => {
          if (globalThis.__mockLlm?.isAiConfigured !== undefined) {
            return globalThis.__mockLlm.isAiConfigured;
          }
          return false;
        };
      `,
    };
  }

  // Intercept JS/JSX files to compile JSX and map import.meta.env
  if (url.startsWith('file://') && !url.includes('node_modules') && (url.endsWith('.js') || url.endsWith('.jsx'))) {
    const filePath = fileURLToPath(url);
    let code;
    try {
      code = await readFile(filePath, 'utf8');
    } catch (err) {
      return nextLoad(url, context);
    }

    // Map import.meta.env to globalThis.__import_meta_env__
    code = code.replace(/import\.meta\.env/g, 'globalThis.__import_meta_env__');

    // Transpile JSX using esbuild
    const loader = url.endsWith('.jsx') ? 'jsx' : 'js';
    const result = transformSync(code, {
      loader: loader,
      format: 'esm',
      target: 'node22',
      jsx: 'automatic',
    });

    return {
      format: 'module',
      shortCircuit: true,
      source: result.code,
    };
  }

  return nextLoad(url, context);
}
