"use client";

export function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Error</h2>
                <p>{message}</p>
                <button className="close-btn" onClick={onClose}>
                    close
                </button>
            </div>
        </div>
    );
}
