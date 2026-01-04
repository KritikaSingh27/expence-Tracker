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
                <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">{isEdit ? "Edit Expense" : "Add New Expense"}</h2>
                    <p className="text-sm text-muted-foreground">{isEdit ? "Make changes to your expense here." : "Add the details of your new expense."}</p>
                </div>

                <form onSubmit={onSubmit} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="amount">Amount *</label>
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

                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="date">Date</label>
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

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="description">Description *</label>
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

                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="category">Category {isEdit ? "" : "(Optional)"}</label>
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

                    {error && <div className="p-3 text-sm text-destructive border border-destructive/50 rounded bg-destructive/10">{error}</div>}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
                        {isEdit && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="btn btn-destructive sm:mr-auto"
                                disabled={submitting}
                            >
                                {submitting ? "Deleting..." : "Delete"}
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="btn btn-outline" disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Save Changes" : "Save Expense")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
