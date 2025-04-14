// ✅ Componente global de modal de limite de uso
import React from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LimitModalProps {
  open: boolean;
  feature: 'dashboards' | 'fileSizeMb' | 'aiRequests';
  onClose: () => void;
}

const featureLabels = {
  dashboards: 'dashboards',
  fileSizeMb: 'file upload size',
  aiRequests: 'AI requests'
};

export function LimitModal({ open, feature, onClose }: LimitModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card w-full max-w-md p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="text-yellow-500 w-5 h-5" />
          <h3 className="text-lg font-semibold">Limit Reached</h3>
        </div>

        <p className="text-gray-300 mb-6">
          You've reached your plan's limit for <strong>{featureLabels[feature]}</strong>. Upgrade your plan to unlock more features.
        </p>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button
            onClick={() => navigate('/plans?upgrade=true')}
            className="btn btn-primary flex items-center"
          >
            Upgrade
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
