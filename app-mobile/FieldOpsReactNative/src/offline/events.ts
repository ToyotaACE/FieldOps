/*
|--------------------------------------------------------------------------
| EVENTOS DE ALTERAÇÃO LOCAL
|--------------------------------------------------------------------------
| O repositório avisa sempre que grava algo no SQLite; telas e o motor de
| sincronização escutam para recarregar os dados.
|
| source = 'user'  ação do técnico (gera nova sincronização)
| source = 'sync'  gravação feita pela própria sincronização (não gera)
*/

export type ChangeSource = 'user' | 'sync';

type Listener = (source: ChangeSource) => void;

const listeners = new Set<Listener>();

export function onLocalChange(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function emitLocalChange(source: ChangeSource = 'user'): void {
  listeners.forEach((listener) => {
    try {
      listener(source);
    } catch (error) {
      console.error('Erro em ouvinte de alteração local:', error);
    }
  });
}
