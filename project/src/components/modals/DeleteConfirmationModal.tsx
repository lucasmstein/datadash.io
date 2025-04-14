import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Dialog } from '@headlessui/react';


interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dashboardTitle: string;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, dashboardTitle }: DeleteConfirmationModalProps) {
  const [input, setInput] = useState('');

  const isConfirmed = input.toLowerCase() === 'confirmar';

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center p-4">
<div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center mb-4 text-yellow-400">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <Dialog.Title className="text-xl font-bold">Confirmar exclusão</Dialog.Title>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          Você está prestes a excluir o dashboard <span className="font-semibold text-white">"{dashboardTitle}"</span>. Essa ação é irreversível.
        </p>

        <p className="text-sm text-gray-400 mb-2">
          Digite <span className="font-bold">confirmar</span> para continuar:
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite aqui..."
          className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
        />

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            className={`px-4 py-2 rounded flex items-center text-white transition ${
              isConfirmed ? 'bg-red-600 hover:bg-red-500' : 'bg-red-900 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Excluir
          </button>
        </div>
      </div>
    </Dialog>
  );
}
