import React from 'react';

const ExpenseModal = ({
    show,
    onClose,
    onSubmit,
    form,
    onChange,
    submitting,
    error,
    isEdit = false,
    onDelete
}) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? "Edit Expense" : "Add New Expense"}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={onSubmit} className="expense-form">
                    <div className="form-row">
                        <div className="field">
                            <label className="field-label" htmlFor="amount">Amount *</label>
                            <input
                                id={isEdit ? "edit-amount" : "amount"}
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max="99999999.99"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={onChange}
                                className="input"
                                required
                            />
                        </div>

                        <div className="field">
                            <label className="field-label" htmlFor="date">Date</label>
                            <input
                                id={isEdit ? "edit-date" : "date"}
                                name="date"
                                type="date"
                                value={form.date}
                                onChange={onChange}
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="description">Description *</label>
                        <input
                            id={isEdit ? "edit-description" : "description"}
                            name="description"
                            type="text"
                            placeholder="e.g. Groceries, Coffee, Taxi..."
                            value={form.description}
                            onChange={onChange}
                            className="input"
                            required
                        />
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="category">Category {isEdit ? "" : "(Optional)"}</label>
                        <input
                            id={isEdit ? "edit-category" : "category"}
                            name="category"
                            type="text"
                            placeholder="e.g. Food, Transport, Entertainment..."
                            value={form.category}
                            onChange={onChange}
                            className="input"
                        />
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="form-actions">
                        {isEdit && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="btn btn-danger"
                                disabled={submitting}
                            >
                                {submitting ? "Deleting..." : "Delete"}
                            </button>
                        )}
                        <div className={isEdit ? "form-actions-right" : ""}>
                            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update" : "Add Expense")}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
