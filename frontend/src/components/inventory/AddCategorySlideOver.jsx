import React from 'react';
import { X } from 'lucide-react';

const AddCategorySlideOver = ({
    isOpen,
    onClose,
    activeCompanyId,
    categoryType,
    setCategoryType,
    categoryName,
    setCategoryName,
    categoryDesc,
    setCategoryDesc,
    showInOnlineStore,
    setShowInOnlineStore,
    onSubmit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end transition-opacity">
            <div className="w-full max-w-2xl bg-slate-50 h-full shadow-2xl flex flex-col justify-between overflow-hidden">
                
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-base font-bold text-slate-900">Add Category (Company ID: {activeCompanyId})</h2>
                    </div>
                    <button 
                        type="button" 
                        onClick={onSubmit} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                        Save Category
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
                        
                        {/* Category Type Selection */}
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-700">Category Type</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                                    <input 
                                        type="radio" 
                                        name="categoryType" 
                                        value="Parent Category" 
                                        checked={categoryType === 'Parent Category'} 
                                        onChange={(e) => setCategoryType(e.target.value)} 
                                        className="text-blue-600" 
                                    />
                                    Parent Category
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                                    <input 
                                        type="radio" 
                                        name="categoryType" 
                                        value="Sub-Category" 
                                        checked={categoryType === 'Sub-Category'} 
                                        onChange={(e) => setCategoryType(e.target.value)} 
                                        className="text-blue-600" 
                                    />
                                    Sub-Category
                                </label>
                            </div>
                        </div>

                        {/* Category Name Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                                <span className="text-rose-500 mr-0.5">*</span>Category Name
                            </label>
                            <input 
                                type="text" 
                                placeholder="e.g. Raw Materials" 
                                value={categoryName} 
                                onChange={(e) => setCategoryName(e.target.value)} 
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden" 
                            />
                        </div>

                        {/* Description Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700">Description</label>
                            <textarea 
                                rows={3} 
                                placeholder="Category description..." 
                                value={categoryDesc} 
                                onChange={(e) => setCategoryDesc(e.target.value)} 
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden resize-none" 
                            />
                        </div>

                        {/* Show in Online Store Toggle */}
                        <div className="space-y-1.5 pt-1">
                            <label className="block text-xs font-semibold text-slate-800">Show in Online Store</label>
                            <button 
                                type="button" 
                                onClick={() => setShowInOnlineStore(!showInOnlineStore)} 
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${showInOnlineStore ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${showInOnlineStore ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddCategorySlideOver;