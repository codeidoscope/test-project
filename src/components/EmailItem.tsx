import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Trash, CheckSquare, Loader } from 'lucide-react';
import { Email } from '../types';
import EmailRenderer from './EmailRenderer';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { parseEmailDate, getRelativeTimeString, formatDate } from '../utils/dateUtils';

interface EmailItemProps {
  email: Email;
  onMarkAsRead: (emailId: string) => Promise<void>;
  onDeleteEmail: (emailId: string) => Promise<void>;
}

const EmailItem: React.FC<EmailItemProps> = ({ email, onMarkAsRead, onDeleteEmail }) => {
  const [expanded, setExpanded] = useState(false);
  const emailRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Store the unsubscribe link in local state to preserve it between re-renders
  const [unsubscribeLink, setUnsubscribeLink] = useState<string | undefined>(email.unsubscribeLink);

  // Update local state when email prop changes, but only if the new value is defined
  useEffect(() => {
    if (email.unsubscribeLink) {
      setUnsubscribeLink(email.unsubscribeLink);
    }
  }, [email.unsubscribeLink]);

  const toggleExpanded = (newState: boolean) => {
    // If we're collapsing the email
    if (expanded && !newState) {
      // Scroll to the email container with smooth animation
      emailRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setExpanded(newState);
  };
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing the email
    onMarkAsRead(email.id);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing the email
    setShowDeleteConfirmation(true);
  };
  
  const confirmDelete = () => {
    onDeleteEmail(email.id);
    setShowDeleteConfirmation(false);
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  // Use local state to determine if we have an unsubscribe link
  const hasUnsubscribeLink = Boolean(unsubscribeLink);

  // Parse the date to display relative time or formatted date
  const parsedDate = parseEmailDate(email.date);
  const relativeDate = getRelativeTimeString(parsedDate);
  const fullDate = formatDate(parsedDate);

  return (
    <div
      ref={emailRef}
      className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
    >
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirmation}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        emailSubject={email.subject}
        isLoading={email.actionLoading === 'delete'}
      />
      <div 
        className="p-4 cursor-pointer flex justify-between items-start"
        onClick={() => toggleExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium text-lg text-gray-900 dark:text-white">{email.subject}</h3>
            <span 
              className="text-sm text-gray-500 dark:text-gray-400" 
              title={fullDate} // Show full date on hover
            >
              {relativeDate}
            </span>
          </div>
          
          {/* Changed from <p> to <div> to fix DOM nesting issue */}
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
            <span className="flex-1">
              {email.from}
              {email.isUnread && (
                <span className="ml-2 bg-blue-500 dark:bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
              {hasUnsubscribeLink && (
                <span className="ml-2">
                  <a 
                    href={unsubscribeLink}
                    data-track-id="unsubscribe-link"
                    className="text-blue-500 dark:text-blue-400 hover:underline"
                    onClick={(e) => e.stopPropagation()} // Prevent expanding when clicking the link
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Unsubscribe
                  </a>
                </span>
              )}
            </span>
            <div className="flex space-x-2 ml-2">
            <a
                href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center text-xs"
                data-track-id="view-in-gmail-button"
                onClick={(e) => e.stopPropagation()} // Prevent expanding when clicking the link
                target="_blank"
                rel="noopener noreferrer"
                title="View in Gmail"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  className="mr-1"
                  fill="currentColor"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                </svg>
                View in Gmail
              </a>
              {email.isUnread && (
                <button
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center text-xs"
                  data-track-id="mark-as-read-button"
                  onClick={handleMarkAsRead}
                  disabled={email.actionLoading === 'mark-read'}
                  title="Mark as read"
                >
                  {email.actionLoading === 'mark-read' ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <>
                      <CheckSquare size={14} className="mr-1" /> Mark as read
                    </>
                  )}
                </button>
              )}
              <button
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center text-xs"
                data-track-id="delete-email-button"
                onClick={handleDelete}
                disabled={email.actionLoading === 'delete'}
                title="Delete email"
              >
                {email.actionLoading === 'delete' ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <>
                    <Trash size={14} className="mr-1" /> Delete email
                  </>
                )}
              </button>
            </div>
          </div>
          
          {!expanded && (
            <div className="mt-3">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Summary:</h4>
              {email.isLoading ? (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Generating summary...
                </div>
              ) : email.summary ? (
                <div>
                  <p className="text-sm bg-blue-50 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200 p-3 rounded">{email.summary}</p>
                  {email.newsletterType && (
                    <p className="text-sm bg-green-50 dark:bg-green-900/30 text-gray-800 dark:text-gray-200 p-2 rounded mt-2">
                      <span className="font-medium">Newsletter Type:</span> {email.newsletterType}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">No summary available</p>
              )}
            </div>
          )}
        </div>
        <div className="ml-4 text-gray-500 dark:text-gray-400">
          {expanded ? <ChevronUp data-track-id="collapse-section-chevron" size={20} /> : <ChevronDown data-track-id="open-section-chevron" size={20} />}
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          <div className="mt-3">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Summary:</h4>
            {email.isLoading ? (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <RefreshCw className="animate-spin mr-2" size={16} />
                Generating summary...
              </div>
            ) : email.summary ? (
              <div>
                <p className="text-sm bg-blue-50 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200 p-3 rounded">{email.summary}</p>
                {email.newsletterType && (
                  <p className="text-sm bg-green-50 dark:bg-green-900/30 text-gray-800 dark:text-gray-200 p-2 rounded mt-2">
                    <span className="font-medium">Newsletter Type:</span> {email.newsletterType}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">No summary available</p>
            )}
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Original Email:</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">{fullDate}</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm max-h-[500px] overflow-y-auto">
              <EmailRenderer
                htmlContent={email.htmlBody}
                textContent={email.textBody || email.snippet}
                className="email-content"
              />
            </div>
            
            <div className="flex mt-3">
              <div className="flex space-x-2 mr-auto">
                {email.isUnread && (
                  <button
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center text-sm"
                    data-track-id="mark-as-read-button"
                    onClick={handleMarkAsRead}
                    disabled={email.actionLoading === 'mark-read'}
                  >
                    {email.actionLoading === 'mark-read' ? (
                      <Loader size={16} className="animate-spin mr-1" />
                    ) : (
                      <CheckSquare size={16} className="mr-1" />
                    )}
                    Mark as read
                  </button>
                )}
                <a
                  href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                  className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center text-sm"
                  onClick={(e) => e.stopPropagation()} // Prevent expanding when clicking the link
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    className="mr-1"
                    fill="currentColor"
                  >
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                  </svg>
                  View in Gmail
                </a>
                <button
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center text-sm"
                  data-track-id="delete-email-button"
                  onClick={handleDelete}
                  disabled={email.actionLoading === 'delete'}
                >
                  {email.actionLoading === 'delete' ? (
                    <Loader size={16} className="animate-spin mr-1" />
                  ) : (
                    <Trash size={16} className="mr-1" />
                  )}
                  Delete email
                </button>
              </div>
              
              <div
                className="p-2 cursor-pointer flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                data-track-id="close-original-email-link"
                onClick={() => toggleExpanded(false)}
              >
                <ChevronUp size={20} className="mr-2" /> Close original email
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailItem;