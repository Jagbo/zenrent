import { BaseDrawer } from './BaseDrawer';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  property?: string;
  unit?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  attachments?: string[];
}

interface TransactionDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionDetailsDrawer: React.FC<TransactionDetailsDrawerProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!transaction) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
    >
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{transaction.description}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {transaction.type === 'income' ? 'Income' : 'Expense'}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="text-sm text-gray-900">{transaction.date}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900">{transaction.category}</dd>
            </div>
            {transaction.property && (
              <div className="py-3 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Property</dt>
                <dd className="text-sm text-gray-900">{transaction.property}</dd>
              </div>
            )}
            {transaction.unit && (
              <div className="py-3 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Unit</dt>
                <dd className="text-sm text-gray-900">{transaction.unit}</dd>
              </div>
            )}
            {transaction.paymentMethod && (
              <div className="py-3 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="text-sm text-gray-900">{transaction.paymentMethod}</dd>
              </div>
            )}
            {transaction.reference && (
              <div className="py-3 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Reference</dt>
                <dd className="text-sm text-gray-900">{transaction.reference}</dd>
              </div>
            )}
          </dl>
        </div>

        {transaction.notes && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
            <p className="text-sm text-gray-900">{transaction.notes}</p>
          </div>
        )}

        {transaction.attachments && transaction.attachments.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
            <ul className="divide-y divide-gray-200">
              {transaction.attachments.map((attachment, index) => (
                <li key={index} className="py-2">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                        {attachment}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <button
            type="button"
            className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="flex-1 bg-[#D9E8FF] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#D9E8FF]/80 focus:outline-none"
            onClick={() => console.log('Edit transaction:', transaction.id)}
          >
            Edit
          </button>
        </div>
      </div>
    </BaseDrawer>
  );
}; 