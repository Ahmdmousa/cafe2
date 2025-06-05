
// POS Main.js

console.log("React script start - Multi-Order Table Version with Suspend/Resume & Settings");

const { useState, useEffect, useMemo, useCallback } = React;

// Helper Functions and Initial Data
const initialProductsData = [
    { id: 'p1', name: 'Espresso', price: 3.50, category: 'Coffee', image: '☕', imageUrl: '', stock: 100, minStock: 10, productType: 'standard', bundleItems: [], variationGroups: [], modifierGroups: [], isTemporarilyUnavailable: false, isArchived: false },
    { id: 'p2', name: 'Cappuccino', price: 4.50, category: 'Coffee', image: '☕', imageUrl: '', stock: 80, minStock: 10, productType: 'standard', bundleItems: [], variationGroups: [], modifierGroups: [], isTemporarilyUnavailable: false, isArchived: false },
    {
        id: 'p3', name: 'Latte', price: 4.75, category: 'Coffee', image: '☕', imageUrl: '', stock: 75, minStock: 10, productType: 'standard', bundleItems: [],
        isTemporarilyUnavailable: false, isArchived: false,
        variationGroups: [
            { id: 'latte_size', name: 'Size', options: [
                { id: 'ls', name: 'Small', priceChange: -0.50 }, { id: 'lm', name: 'Medium', priceChange: 0 }, { id: 'll', name: 'Large', priceChange: 0.75 }
            ]}
        ],
        modifierGroups: [
            { id: 'latte_milk', name: 'Milk Type', selectionType: 'single', options: [
                { id: 'ld', name: 'Dairy', priceChange: 0 }, { id: 'lo', name: 'Oat', priceChange: 0.60 }, { id: 'la', name: 'Almond', priceChange: 0.60 }
            ]}
        ]
    },
    { id: 'p10', name: 'Croissant', price: 2.75, category: 'Pastry', image: '🥐', imageUrl: '', stock: 25, minStock: 5, productType: 'standard', bundleItems: [], variationGroups: [], modifierGroups: [], isTemporarilyUnavailable: false, isArchived: false },
    {
        id: 'b1', name: 'Breakfast Combo', price: 6.50, category: 'Combos', image: '🍳', imageUrl: '', stock: 0, minStock: 0,
        productType: 'bundle',
        bundleItems: [
            { productId: 'p3', quantity: 1, preSelectedOptions: [{groupId: 'latte_size', optionId: 'lm'}] },
            { productId: 'p10', quantity: 1, preSelectedOptions: [] }
        ],
        variationGroups: [], modifierGroups: [], isTemporarilyUnavailable: false, isArchived: false
    },
     { id: 'p12', name: 'Chicken Sandwich', price: 5.50, category: 'Food', image: '🥪', imageUrl: 'https://placehold.co/180x120/D2E7D6/27AE60?text=Sandwich', stock: 15, minStock: 3, productType: 'standard', bundleItems: [],
        isTemporarilyUnavailable: false, isArchived: false,
        variationGroups: [],
        modifierGroups: [
            { id: 'sw_addons', name: 'Add-ons', selectionType: 'multiple', options: [
                { id: 'sw_cheese', name: 'Extra Cheese', priceChange: 0.75 }, { id: 'sw_bacon', name: 'Bacon', priceChange: 1.50 }
            ]}
        ]
    },
];

const LOYALTY_POINT_VALUE = 0.01;
const DEFAULT_TAX_RATE = 0.08;
const DEFAULT_SERVICE_CHARGE_RATE = 0.0;

const initialSettings = {
    cafeName: 'My Cafe',
    cafeAddress: '123 Main Street, Anytown',
    cafePhone: '555-1234',
    cafeWebsite: 'www.mycafe.com',
    cafeLogoUrl: 'https://placehold.co/150x80/EBF8FF/3B82F6?text=My+Cafe+Logo',
    receiptHeaderMsg: 'Thank You For Your Visit!',
    receiptFooterMsg: 'Follow us @mycafe',
    showReceiptLogo: true,
    taxRate: DEFAULT_TAX_RATE,
    serviceChargeRate: DEFAULT_SERVICE_CHARGE_RATE,
    adminPin: '',
    // Add this setting to your settings object (if not present)
    // ...existing settings...
    disableStock: false, // Add this line
    // ...existing settings...
};

const initialExpenses = [];

function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                if (key === 'posSettings_v1') {
                    return {
                        ...initialSettings,
                        ...parsed,
                        taxRate: typeof parsed.taxRate === 'number' ? parsed.taxRate : initialSettings.taxRate,
                        serviceChargeRate: typeof parsed.serviceChargeRate === 'number' ? parsed.serviceChargeRate : initialSettings.serviceChargeRate,
                        showReceiptLogo: typeof parsed.showReceiptLogo === 'boolean' ? parsed.showReceiptLogo : initialSettings.showReceiptLogo,
                        cafeLogoUrl: parsed.cafeLogoUrl || initialSettings.cafeLogoUrl,
                    };
                }
                if (key === 'posProducts_v_multiOrder_1' && Array.isArray(parsed)) {
                    return parsed.map(p => ({
                        ...p,
                        productType: p.productType || 'standard',
                        bundleItems: (p.bundleItems || []).map(bi => ({...bi, preSelectedOptions: bi.preSelectedOptions || [] })),
                        variationGroups: p.variationGroups || [],
                        modifierGroups: p.modifierGroups || [],
                        isTemporarilyUnavailable: typeof p.isTemporarilyUnavailable === 'boolean' ? p.isTemporarilyUnavailable : false,
                        isArchived: typeof p.isArchived === 'boolean' ? p.isArchived : false,
                        imageUrl: p.imageUrl || ''
                    }));
                }
                 if (key === 'posOrderHistory_v_multiOrder_1' && Array.isArray(parsed)) {
                    return parsed.map(order => ({
                        ...order,
                        customerId: order.customerId || null,
                        status: order.status || 'Unknown',
                        tableId: order.tableId || null,
                        linkedActiveOrderLabel: order.linkedActiveOrderLabel || (order.customer || `Order ${order.id.slice(0,4)}`),
                        appliedDiscountInfo: order.appliedDiscountInfo || { type: 'none', value: 0 },
                        paymentMethodsUsed: order.paymentMethodsUsed && order.paymentMethodsUsed.length > 0 ? order.paymentMethodsUsed : [{method: order.paymentMethod || 'cash', amount: order.total, received: order.amountReceived || order.total }],
                        paidWithLoyaltyAmount: order.paidWithLoyaltyAmount || 0,
                        loyaltyPointsRedeemed: order.loyaltyPointsRedeemed || 0,
                        notes: order.notes || '',
                        returnedItems: order.returnedItems || [],
                        returnReason: order.returnReason || '',
                        returnDate: order.returnDate || null,
                        originalOrderId: order.originalOrderId || null,
                        type: order.type || 'sale',
                    }));
                }
                if (key === 'posTables_v_multiOrder_1' && Array.isArray(parsed)) {
                    return parsed.map(t => ({
                        ...t,
                        activeOrders: Array.isArray(t.activeOrders) ? t.activeOrders.map(ao => ({
                            orderId: ao.orderId,
                            displayLabel: ao.displayLabel || `Order ${ao.orderId.slice(0,4)}`,
                            total: typeof ao.total === 'number' ? ao.total : 0,
                            status: ao.status || 'active'
                        })) : [],
                        status: t.status || 'available'
                    }));
                }
                if (key === 'posExpenses_v1' && Array.isArray(parsed)) {
                    return parsed.map(exp => ({
                        ...exp,
                        date: exp.date || new Date().toISOString().split('T')[0]
                    }));
                }
                return parsed;
            }
            if (key === 'posSettings_v1') return initialSettings;
            if (key === 'posExpenses_v1') return initialExpenses;
            if (key === 'posOrderHistory_v_multiOrder_1' && Array.isArray(initialValue)) {
                return initialValue.map(order => ({
                    ...order,
                    appliedDiscountInfo: order.appliedDiscountInfo || { type: 'none', value: 0 },
                    paymentMethodsUsed: order.paymentMethodsUsed || [],
                    paidWithLoyaltyAmount: order.paidWithLoyaltyAmount || 0,
                    loyaltyPointsRedeemed: order.loyaltyPointsRedeemed || 0,
                    notes: order.notes || '',
                    returnedItems: order.returnedItems || [],
                    returnReason: order.returnReason || '',
                    returnDate: order.returnDate || null,
                    originalOrderId: order.originalOrderId || null,
                    type: order.type || 'sale',
                }));
            }
            return initialValue;
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);
    return [storedValue, setValue];
}

const generateId = () => {
    if (typeof window.uuid !== 'undefined' && typeof window.uuid.v4 === 'function') {
        return window.uuid.v4();
    }
    return 'fb-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

const EMAILJS_SERVICE_ID = 'service_auw7spm';
const EMAILJS_TEMPLATE_ID = 'template_oocl6fa';
const EMAILJS_USER_ID = 'eKWkV45YgFn3sbkHh';

const calculateBundleAvailability = (bundleProduct, allProducts) => {
    if (!bundleProduct || bundleProduct.productType !== 'bundle' || !bundleProduct.bundleItems || bundleProduct.bundleItems.length === 0) {
        return 0;
    }
    let maxBundlesPossible = Infinity;
    let possible = true;
    for (const bundleItem of bundleProduct.bundleItems) {
        const componentProduct = allProducts.find(p => p.id === bundleItem.productId);
        if (!componentProduct || componentProduct.isArchived || componentProduct.isTemporarilyUnavailable) {
            possible = false; break;
        }
        if (bundleItem.quantity <= 0) {
            possible = false; break;
        }
        if (componentProduct.stock < bundleItem.quantity) {
            possible = false; break;
        }
        maxBundlesPossible = Math.min(maxBundlesPossible, Math.floor(componentProduct.stock / bundleItem.quantity));
    }
    return possible ? maxBundlesPossible : 0;
};

const getStockStatus = (product, allProducts) => {
    if (!product) return 'in-stock';
    if (product.productType === 'bundle') {
        const bundleStock = calculateBundleAvailability(product, allProducts);
        return bundleStock > 0 ? 'in-stock' : 'out-of-stock';
    }
    if (typeof product.stock === 'undefined') return 'in-stock';
    if (product.stock <= 0) return 'out-of-stock';
    if (product.stock <= product.minStock) return 'low-stock';
    return 'in-stock';
};

function OptionsSelectionModal({ product, onClose, onAddToCart }) {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [currentPrice, setCurrentPrice] = useState(product.price);
    useEffect(() => {
        const initialSelections = {};
        (product.variationGroups || []).forEach(group => {
            if (group.options && group.options.length > 0) {
                initialSelections[group.id] = group.options[0].id;
            }
        });
           (product.modifierGroups || []).forEach(group => {
            if (group.selectionType === 'single' && group.options && group.options.length > 0) {
            } else if (group.selectionType === 'multiple') {
                initialSelections[group.id] = [];
            }
        });
        setSelectedOptions(initialSelections);
    }, [product]);
    useEffect(() => {
        let price = product.price;
        (product.variationGroups || []).forEach(group => {
            const selectedOptionId = selectedOptions[group.id];
            if (selectedOptionId) {
                const option = group.options.find(opt => opt.id === selectedOptionId);
                if (option) price += option.priceChange;
            }
        });
        (product.modifierGroups || []).forEach(group => {
            if (group.selectionType === 'single') {
                const selectedOptionId = selectedOptions[group.id];
                if (selectedOptionId) {
                    const option = group.options.find(opt => opt.id === selectedOptionId);
                    if (option) price += option.priceChange;
                }
            } else if (group.selectionType === 'multiple') {
                const selectedOptionIds = selectedOptions[group.id] || [];
                selectedOptionIds.forEach(optId => {
                    const option = group.options.find(opt => opt.id === optId);
                    if (option) price += option.priceChange;
                });
            }
        });
        setCurrentPrice(price);
    }, [selectedOptions, product]);
    const handleOptionChange = (groupId, optionId, selectionType) => {
        setSelectedOptions(prev => {
            const newSelections = { ...prev };
            if (selectionType === 'single') {
                newSelections[groupId] = optionId;
            } else if (selectionType === 'multiple') {
                const currentGroupSelections = prev[groupId] ? [...prev[groupId]] : [];
                const index = currentGroupSelections.indexOf(optionId);
                if (index > -1) {
                    currentGroupSelections.splice(index, 1);
                } else {
                    currentGroupSelections.push(optionId);
                }
                newSelections[groupId] = currentGroupSelections;
            }
            return newSelections;
        });
    };
    const handleConfirm = () => {
        const finalSelectedOptionsDetailed = [];
        (product.variationGroups || []).forEach(group => {
            const selectedOptId = selectedOptions[group.id];
            if (selectedOptId) {
                const option = group.options.find(opt => opt.id === selectedOptId);
                if (option) finalSelectedOptionsDetailed.push({ groupName: group.name, optionName: option.name, priceChange: option.priceChange, groupId: group.id, optionId: option.id });
            }
        });
        (product.modifierGroups || []).forEach(group => {
            if (group.selectionType === 'single') {
                const selectedOptId = selectedOptions[group.id];
                if (selectedOptId) {
                    const option = group.options.find(opt => opt.id === selectedOptId);
                    if (option) finalSelectedOptionsDetailed.push({ groupName: group.name, optionName: option.name, priceChange: option.priceChange, groupId: group.id, optionId: option.id });
                }
            } else {
                const selectedOptIds = selectedOptions[group.id] || [];
                selectedOptIds.forEach(optId => {
                     const option = group.options.find(opt => opt.id === optId);
                    if (option) finalSelectedOptionsDetailed.push({ groupName: group.name, optionName: option.name, priceChange: option.priceChange, groupId: group.id, optionId: option.id });
                });
            }
        });
        onAddToCart(product, finalSelectedOptionsDetailed);
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: "600px"}}>
                <div className="modal-header">
                    <h3 className="modal-title">Customize {product.name}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-content options-form">
                    {(product.variationGroups || []).map(group => (
                        <div key={group.id} className="options-group">
                            <h4>{group.name} (Select one)</h4>
                            {group.options.map(option => (
                                <label key={option.id} className="option-label">
                                    <input type="radio" name={group.id} value={option.id}
                                        checked={selectedOptions[group.id] === option.id}
                                        onChange={() => handleOptionChange(group.id, option.id, 'single')}
                                    />
                                    {option.name}
                                    {option.priceChange !== 0 &&
                                        <span className="option-price">({option.priceChange > 0 ? '+' : ''}${option.priceChange.toFixed(2)})</span>}
                                </label>
                            ))}
                        </div>
                    ))}
                    {(product.modifierGroups || []).map(group => (
                        <div key={group.id} className="options-group">
                            <h4>{group.name} (Select {group.selectionType === 'single' ? 'one' : 'any'})</h4>
                            {group.options.map(option => (
                                <label key={option.id} className="option-label">
                                    <input
                                        type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                                        name={group.id}
                                        value={option.id}
                                        checked={group.selectionType === 'single' ? selectedOptions[group.id] === option.id : (selectedOptions[group.id] || []).includes(option.id)}
                                        onChange={() => handleOptionChange(group.id, option.id, group.selectionType)}
                                    />
                                    {option.name}
                                    {option.priceChange !== 0 &&
                                        <span className="option-price">({option.priceChange > 0 ? '+' : ''}${option.priceChange.toFixed(2)})</span>}
                                </label>
                            ))}
                        </div>
                    ))}
                     <div className="current-item-price">
                        Current Item Price: ${currentPrice.toFixed(2)}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleConfirm}>Add to Order</button>
                </div>
            </div>
        </div>
    );
}

function AdminView({
    products, addProduct, updateProduct, removeProduct, archiveProduct, unarchiveProduct,
    categories: initialCategories, onRenameCategory, onExportProducts, onImportProducts,
    tables, addTable, updateTable, removeTable
}) {
    const initialFormState = {
        id: null, name: '', price: '', category: '', image: '❓', imageUrl: '', stock: '', minStock: '',
        isTemporarilyUnavailable: false, isArchived: false,
        productType: 'standard', bundleItems: [],
        variationGroups: [], modifierGroups: []
    };
    const [productForm, setProductForm] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryToRename, setCategoryToRename] = useState('');
    const [newCategoryRenameInput, setNewCategoryRenameInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const initialTableFormState = { id: null, name: '', capacity: '' };
    const [tableForm, setTableForm] = useState(initialTableFormState);
    const [isEditingTable, setIsEditingTable] = useState(false);
    const availableCategories = useMemo(() => initialCategories.filter(c => c && c !== "All"), [initialCategories]);
    const standardProductsForBundle = useMemo(() => products.filter(p => p.productType === 'standard' && !p.isArchived), [products]);
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (name === "category" && value === "---new---") setIsNewCategory(true);
        else if (name === "category") setIsNewCategory(false);
        if (name === "productType" && value === "bundle") setProductForm(prev => ({ ...prev, stock: '', minStock: '' }));
    };
    const resetForm = () => {
        setProductForm(initialFormState);
        setIsEditing(false);
        setNewCategoryName('');
        setIsNewCategory(false);
    };
    const handleEditClick = (productToEdit) => {
        setIsEditing(true);
        setProductForm({
            id: productToEdit.id,
            name: productToEdit.name || '',
            price: productToEdit.price?.toString() || '',
            category: productToEdit.category || '',
            image: productToEdit.image || '❓',
            imageUrl: productToEdit.imageUrl || '',
            stock: productToEdit.productType === 'bundle' ? '' : (productToEdit.stock?.toString() || ''),
            minStock: productToEdit.productType === 'bundle' ? '' : (productToEdit.minStock?.toString() || ''),
            isTemporarilyUnavailable: productToEdit.isTemporarilyUnavailable || false,
            isArchived: productToEdit.isArchived || false,
            productType: productToEdit.productType || 'standard',
            bundleItems: JSON.parse(JSON.stringify(productToEdit.bundleItems || [])).map(bi => ({...bi, preSelectedOptions: bi.preSelectedOptions || []})),
            variationGroups: JSON.parse(JSON.stringify(productToEdit.variationGroups || [])),
            modifierGroups: JSON.parse(JSON.stringify(productToEdit.modifierGroups || []))
        });
        setIsNewCategory(false);
        window.scrollTo(0, 0);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        let finalCategory = productForm.category;
        if (isNewCategory && !isEditing) {
            if (!newCategoryName.trim()) { alert("Please enter a name for the new category."); return; }
            finalCategory = newCategoryName.trim();
        }
        if (!productForm.name || !productForm.price || !finalCategory) {
            alert("Please fill in Name, Price, and Category."); return;
        }
        if (productForm.productType === 'standard' && (productForm.stock === '' || productForm.minStock === '')) {
            alert("Please fill in Stock and Min Stock for standard products."); return;
        }
        if (productForm.productType === 'bundle' && productForm.bundleItems.filter(item => item.productId && item.quantity > 0).length === 0) {
            alert("Bundles must contain at least one valid item."); return;
        }
        const productData = {
            name: productForm.name, price: parseFloat(productForm.price), category: finalCategory, image: productForm.image, imageUrl: productForm.imageUrl.trim(),
            stock: productForm.productType === 'standard' ? parseInt(productForm.stock) : 0,
            minStock: productForm.productType === 'standard' ? parseInt(productForm.minStock) : 0,
            isTemporarilyUnavailable: productForm.isTemporarilyUnavailable, isArchived: productForm.isArchived, productType: productForm.productType,
            bundleItems: productForm.productType === 'bundle' ? productForm.bundleItems.filter(item => item.productId && item.quantity > 0).map(bi => ({...bi, preSelectedOptions: bi.preSelectedOptions || []})) : [],
            variationGroups: productForm.variationGroups.map(vg => ({...vg, id: vg.id || generateId(), options: vg.options.filter(opt => opt.name.trim() !== '').map(opt => ({...opt, id: opt.id || generateId(), priceChange: parseFloat(opt.priceChange) || 0 }))})).filter(vg => vg.name.trim() !== '' && vg.options.length > 0),
            modifierGroups: productForm.modifierGroups.map(mg => ({...mg, id: mg.id || generateId(), options: mg.options.filter(opt => opt.name.trim() !== '').map(opt => ({...opt, id: opt.id || generateId(), priceChange: parseFloat(opt.priceChange) || 0 }))})).filter(mg => mg.name.trim() !== '' && mg.options.length > 0)
        };
        if (isEditing) updateProduct(productForm.id, productData);
        else addProduct(productData);
        resetForm();
    };
    const handleCategoryRenameSubmit = (e) => {
        e.preventDefault();
        if (!categoryToRename || !newCategoryRenameInput.trim()) { alert("Please select a category and provide a new name."); return; }
        onRenameCategory(categoryToRename, newCategoryRenameInput.trim());
        setCategoryToRename(''); setNewCategoryRenameInput('');
    };
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) { setSelectedFile(file); document.getElementById('fileNameLabelAdmin').textContent = file.name; }
        else { setSelectedFile(null); document.getElementById('fileNameLabelAdmin').textContent = 'No file chosen'; }
    };
    const triggerImport = () => {
        if (selectedFile) {
            onImportProducts(selectedFile);
            const fileInput = document.getElementById('productImportFileAdmin');
            if(fileInput) fileInput.value = "";
            setSelectedFile(null); document.getElementById('fileNameLabelAdmin').textContent = 'No file chosen';
        } else alert("Please select a JSON file first.");
    };
    const addOptionGroup = (groupType) => setProductForm(prev => ({ ...prev, [groupType]: [...(prev[groupType] || []), { id: generateId(), name: '', selectionType: groupType === 'modifierGroups' ? 'single' : undefined, options: [{ id: generateId(), name: '', priceChange: '0' }] }] }));
    const removeOptionGroup = (groupType, groupIndex) => setProductForm(prev => ({ ...prev, [groupType]: prev[groupType].filter((_, index) => index !== groupIndex) }));
    const handleGroupChange = (groupType, groupIndex, field, value) => setProductForm(prev => { const newGroups = JSON.parse(JSON.stringify(prev[groupType])); newGroups[groupIndex] = { ...newGroups[groupIndex], [field]: value }; return { ...prev, [groupType]: newGroups }; });
    const addOptionToGroup = (groupType, groupIndex) => setProductForm(prev => { const newGroups = JSON.parse(JSON.stringify(prev[groupType])); newGroups[groupIndex].options = [...newGroups[groupIndex].options, { id: generateId(), name: '', priceChange: '0' }]; return { ...prev, [groupType]: newGroups }; });
    const removeOptionFromGroup = (groupType, groupIndex, optionIndex) => setProductForm(prev => { const newGroups = JSON.parse(JSON.stringify(prev[groupType])); newGroups[groupIndex].options = newGroups[groupIndex].options.filter((_, index) => index !== optionIndex); return { ...prev, [groupType]: newGroups }; });
    const handleOptionDetailChange = (groupType, groupIndex, optionIndex, field, value) => setProductForm(prev => { const newGroups = JSON.parse(JSON.stringify(prev[groupType])); newGroups[groupIndex].options[optionIndex] = { ...newGroups[groupIndex].options[optionIndex], [field]: value }; return { ...prev, [groupType]: newGroups }; });
    const addBundleItem = () => setProductForm(prev => ({ ...prev, bundleItems: [...(prev.bundleItems || []), { productId: '', quantity: 1, preSelectedOptions: [] }] }));
    const handleBundleItemChange = (index, field, value) => setProductForm(prev => {
        const newBundleItems = JSON.parse(JSON.stringify(prev.bundleItems));
        newBundleItems[index] = { ...newBundleItems[index], [field]: field === 'quantity' ? parseInt(value) || 1 : value };
        if (field === 'productId') {
            const selectedProd = products.find(p => p.id === value); newBundleItems[index].preSelectedOptions = [];
            if (selectedProd) {
                (selectedProd.variationGroups || []).forEach(vg => { if (vg.options && vg.options.length > 0) newBundleItems[index].preSelectedOptions.push({ groupId: vg.id, optionId: vg.options[0].id }); });
                (selectedProd.modifierGroups || []).filter(mg => mg.selectionType === 'single').forEach(mg => { if (mg.options && mg.options.length > 0) newBundleItems[index].preSelectedOptions.push({ groupId: mg.id, optionId: '' }); });
            }
        } return { ...prev, bundleItems: newBundleItems };
    });
    const handleBundleItemOptionChange = (bundleItemIndex, groupType, groupId, optionId) => setProductForm(prev => {
        const newBundleItems = JSON.parse(JSON.stringify(prev.bundleItems)); const bundleItem = newBundleItems[bundleItemIndex];
        if (!bundleItem.preSelectedOptions) bundleItem.preSelectedOptions = [];
        const existingOptionIndex = bundleItem.preSelectedOptions.findIndex(opt => opt.groupId === groupId);
        if (optionId === '') { if (existingOptionIndex > -1) bundleItem.preSelectedOptions.splice(existingOptionIndex, 1); }
        else { if (existingOptionIndex > -1) bundleItem.preSelectedOptions[existingOptionIndex].optionId = optionId; else bundleItem.preSelectedOptions.push({ groupId, optionId }); }
        return { ...prev, bundleItems: newBundleItems };
    });
    const removeBundleItem = (index) => setProductForm(prev => ({ ...prev, bundleItems: prev.bundleItems.filter((_, i) => i !== index) }));
    const handleTableInputChange = (e) => { const { name, value } = e.target; setTableForm(prev => ({ ...prev, [name]: value })); };
    const handleTableSubmit = (e) => {
        e.preventDefault();
        if (!tableForm.name.trim() || !tableForm.capacity) { alert("Table Name and Capacity are required."); return; }
        if (isEditingTable) updateTable(tableForm.id, { name: tableForm.name, capacity: parseInt(tableForm.capacity) });
        else addTable({ name: tableForm.name, capacity: parseInt(tableForm.capacity) });
        setTableForm(initialTableFormState); setIsEditingTable(false);
    };
    const handleEditTableClick = (table) => { setIsEditingTable(true); setTableForm({id: table.id, name: table.name, capacity: table.capacity }); };
    const handleCancelEditTable = () => { setIsEditingTable(false); setTableForm(initialTableFormState); };

    return (
        <div className="admin-container">
            <h2>Admin Panel</h2>
            <div className="admin-section">
                <h3>{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                <form onSubmit={handleSubmit} className="product-management-form">
                    <div className="form-group"><label className="form-label">Name:</label><input type="text" name="name" value={productForm.name} onChange={handleInputChange} className="form-input" required /></div>
                    <div className="form-group"><label className="form-label">Price ($):</label><input type="number" name="price" value={productForm.price} onChange={handleInputChange} className="form-input" step="0.01" min="0" required /></div>
                    <div className="form-group">
                        <label className="form-label">Category:</label>
                        <select name="category" value={productForm.category} onChange={handleInputChange} className="form-input" required>
                            <option value="">Select Category</option>
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            {!isEditing && <option value="---new---">Add New Category...</option>}
                        </select>
                        {isNewCategory && !isEditing && (<input type="text" placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="form-input" style={{marginTop: '5px'}} required/> )}
                    </div>
                    <div className="form-group"><label className="form-label">Image (Emoji):</label><input type="text" name="image" value={productForm.image} onChange={handleInputChange} className="form-input" maxLength="2"/></div>
                    <div className="form-group"><label className="form-label">Image URL (Optional):</label><input type="url" name="imageUrl" value={productForm.imageUrl} onChange={handleInputChange} className="form-input" placeholder="https://example.com/image.jpg" /></div>
                    <div className="form-group form-group-full">
                        <label className="form-label">Product Type:</label>
                        <select name="productType" value={productForm.productType} onChange={handleInputChange} className="form-input">
                            <option value="standard">Standard</option>
                            <option value="bundle">Bundle/Combo</option>
                        </select>
                    </div>
                    {productForm.productType === 'standard' && (
                        <>
                            <div className="form-group"><label className="form-label">Stock:</label><input type="number" name="stock" value={productForm.stock} onChange={handleInputChange} className="form-input" min="0" required /></div>
                            <div className="form-group"><label className="form-label">Min Stock:</label><input type="number" name="minStock" value={productForm.minStock} onChange={handleInputChange} className="form-input" min="0" required /></div>
                        </>
                    )}
                    <div className="form-group form-group-checkbox" style={{gridColumn: '1 / -1'}}>
                        <input type="checkbox" id="isTemporarilyUnavailable" name="isTemporarilyUnavailable" checked={productForm.isTemporarilyUnavailable} onChange={handleInputChange} />
                        <label htmlFor="isTemporarilyUnavailable" className="form-label" style={{marginBottom: 0}}>Temporarily Unavailable</label>
                    </div>
                     <div className="form-group form-group-checkbox" style={{gridColumn: '1 / -1'}}>
                        <input type="checkbox" id="isArchived" name="isArchived" checked={productForm.isArchived} onChange={handleInputChange} />
                        <label htmlFor="isArchived" className="form-label" style={{marginBottom: 0}}>Archived (Hide from POS)</label>
                    </div>

                    {productForm.productType === 'bundle' && (
                        <fieldset className="product-options-group" style={{gridColumn: '1 / -1'}}>
                            <h4>Bundle Items (Select standard products)</h4>
                            {productForm.bundleItems.map((item, index) => {
                                const selectedProductForBundle = products.find(p => p.id === item.productId);
                                return (
                                    <div key={index} style={{border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px'}}>
                                        <div className="bundle-item-entry">
                                            <select value={item.productId} onChange={(e) => handleBundleItemChange(index, 'productId', e.target.value)} className="form-input" >
                                                <option value="">Select Product</option>
                                                {standardProductsForBundle.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <input type="number" value={item.quantity} onChange={(e) => handleBundleItemChange(index, 'quantity', e.target.value)} className="form-input" min="1" placeholder="Qty"/>
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeBundleItem(index)}>&times;</button>
                                        </div>
                                        {selectedProductForBundle && (selectedProductForBundle.variationGroups?.length > 0 || selectedProductForBundle.modifierGroups?.filter(mg => mg.selectionType === 'single').length > 0) && (
                                            <div className="bundle-item-options">
                                                <strong>Pre-select options for {selectedProductForBundle.name}:</strong>
                                                {(selectedProductForBundle.variationGroups || []).map(vg => (
                                                    <div key={vg.id} className="form-group-inline">
                                                        <label className="form-label" style={{flexGrow:0, marginRight:'5px', whiteSpace: 'nowrap'}}>{vg.name}:</label>
                                                        <select value={item.preSelectedOptions?.find(opt => opt.groupId === vg.id)?.optionId || (vg.options.length > 0 ? vg.options[0].id : '')} onChange={(e) => handleBundleItemOptionChange(index, 'variationGroups', vg.id, e.target.value)} className="form-input" >
                                                            {vg.options.map(opt => <option key={opt.id} value={opt.id}>{opt.name} {opt.priceChange !==0 ? `(${opt.priceChange > 0 ? '+':''}${opt.priceChange.toFixed(2)})` : ''}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                                {(selectedProductForBundle.modifierGroups || []).filter(mg => mg.selectionType === 'single').map(mg => (
                                                    <div key={mg.id} className="form-group-inline">
                                                        <label className="form-label" style={{flexGrow:0, marginRight:'5px', whiteSpace: 'nowrap'}}>{mg.name}:</label>
                                                        <select value={item.preSelectedOptions?.find(opt => opt.groupId === mg.id)?.optionId || ''} onChange={(e) => handleBundleItemOptionChange(index, 'modifierGroups', mg.id, e.target.value)} className="form-input" >
                                                            <option value="">None</option>
                                                            {mg.options.map(opt => <option key={opt.id} value={opt.id}>{opt.name} {opt.priceChange !==0 ? `(${opt.priceChange > 0 ? '+':''}${opt.priceChange.toFixed(2)})` : ''}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addBundleItem}>+ Add Item to Bundle</button>
                        </fieldset>
                    )}

                    {productForm.productType === 'standard' && (
                        <>
                            <fieldset className="product-options-group" style={{gridColumn: '1 / -1'}}>
                                <h4>Variation Groups (e.g., Size - Customer must pick one)</h4>
                                {productForm.variationGroups.map((vg, groupIndex) => (
                                    <div key={vg.id || groupIndex} style={{border: '1px dashed #ccc', padding: '10px', marginBottom: '10px', borderRadius: '4px'}}>
                                        <div className="form-group-inline">
                                            <input type="text" placeholder="Variation Group Name" value={vg.name} onChange={(e) => handleGroupChange('variationGroups', groupIndex, 'name', e.target.value)} className="form-input" />
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOptionGroup('variationGroups', groupIndex)}>Remove Group</button>
                                        </div>
                                        {vg.options.map((opt, optIndex) => (
                                            <div className="option-entry" key={opt.id || optIndex}>
                                                <input type="text" placeholder="Option Name" value={opt.name} onChange={(e) => handleOptionDetailChange('variationGroups', groupIndex, optIndex, 'name', e.target.value)} className="form-input" />
                                                <input type="number" placeholder="Price +/-" value={opt.priceChange} onChange={(e) => handleOptionDetailChange('variationGroups', groupIndex, optIndex, 'priceChange', e.target.value)} className="form-input" step="0.01" />
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOptionFromGroup('variationGroups', groupIndex, optIndex)}>&times;</button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addOptionToGroup('variationGroups', groupIndex)}>+ Add Option</button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-info btn-sm" style={{marginTop: '10px'}} onClick={() => addOptionGroup('variationGroups')}>+ Add Variation Group</button>
                            </fieldset>
                            <fieldset className="product-options-group" style={{gridColumn: '1 / -1'}}>
                                <h4>Modifier Groups (e.g., Milk, Add-ons)</h4>
                                {productForm.modifierGroups.map((mg, groupIndex) => (
                                     <div key={mg.id || groupIndex} style={{border: '1px dashed #ccc', padding: '10px', marginBottom: '10px', borderRadius: '4px'}}>
                                        <div className="form-group-inline">
                                            <input type="text" placeholder="Modifier Group Name" value={mg.name} onChange={(e) => handleGroupChange('modifierGroups', groupIndex, 'name', e.target.value)} className="form-input" />
                                            <select name="selectionType" value={mg.selectionType} onChange={(e) => handleGroupChange('modifierGroups', groupIndex, 'selectionType', e.target.value)} className="form-input" style={{flexGrow: 0.5}}>
                                                <option value="single">Single Choice</option>
                                                <option value="multiple">Multiple Choices</option>
                                            </select>
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOptionGroup('modifierGroups', groupIndex)}>Remove Group</button>
                                        </div>
                                        {mg.options.map((opt, optIndex) => (
                                            <div className="option-entry" key={opt.id || optIndex}>
                                                <input type="text" placeholder="Option Name" value={opt.name} onChange={(e) => handleOptionDetailChange('modifierGroups', groupIndex, optIndex, 'name', e.target.value)} className="form-input" />
                                                <input type="number" placeholder="Price +/-" value={opt.priceChange} onChange={(e) => handleOptionDetailChange('modifierGroups', groupIndex, optIndex, 'priceChange', e.target.value)} className="form-input" step="0.01" />
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOptionFromGroup('modifierGroups', groupIndex, optIndex)}>&times;</button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addOptionToGroup('modifierGroups', groupIndex)}>+ Add Option</button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-info btn-sm" style={{marginTop: '10px'}} onClick={() => addOptionGroup('modifierGroups')}>+ Add Modifier Group</button>
                            </fieldset>
                        </>
                    )}
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" style={{width: 'auto', paddingLeft: '30px', paddingRight: '30px'}}>{isEditing ? 'Update Product' : 'Add Product'}</button>
                        {isEditing && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel Edit</button>}
                    </div>
                </form>
            </div>
            <div className="admin-section">
                <h3>Manage Categories</h3>
                <form onSubmit={handleCategoryRenameSubmit} className="form-group-inline">
                    <select value={categoryToRename} onChange={(e) => setCategoryToRename(e.target.value)} className="form-input">
                        <option value="">Select category to rename</option>
                        {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="text" value={newCategoryRenameInput} onChange={(e) => setNewCategoryRenameInput(e.target.value)} placeholder="New category name" className="form-input" />
                    <button type="submit" className="btn btn-primary" disabled={!categoryToRename || !newCategoryRenameInput.trim()}>Rename</button>
                </form>
            </div>
            <div className="admin-section">
                <h3>Manage Tables</h3>
                <form onSubmit={handleTableSubmit} className="product-management-form" style={{gridTemplateColumns: '2fr 1fr auto', alignItems: 'end'}}>
                     <div className="form-group">
                        <label className="form-label">Table Name:</label>
                        <input type="text" name="name" value={tableForm.name} onChange={handleTableInputChange} className="form-input" required />
                    </div>
                     <div className="form-group">
                        <label className="form-label">Capacity:</label>
                        <input type="number" name="capacity" value={tableForm.capacity} onChange={handleTableInputChange} className="form-input" min="1" required />
                    </div>
                    <div className="form-group" style={{alignSelf: 'end'}}>
                        <button type="submit" className="btn btn-primary">{isEditingTable ? 'Update Table' : 'Add Table'}</button>
                        {isEditingTable && <button type="button" className="btn btn-secondary" onClick={handleCancelEditTable} style={{marginLeft:'10px'}}>Cancel</button>}
                    </div>
                </form>
                <div className="table-management-list" style={{marginTop: '20px'}}>
                    <h4>Existing Tables ({tables.length})</h4>
                    {tables.length > 0 ? (
                        <table>
                            <thead>
                                <tr><th>Name</th><th>Capacity</th><th>Current Status</th><th>Active Orders</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {tables.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{t.capacity}</td>
                                        <td style={{textTransform: 'capitalize'}}>{(t.activeOrders && t.activeOrders.length > 0) ? 'Occupied' : t.status.replace(/_/g, ' ')}</td>
                                        <td>{t.activeOrders ? t.activeOrders.length : 0}</td>
                                        <td>
                                            <button className="btn btn-edit btn-sm" onClick={() => handleEditTableClick(t)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => removeTable(t.id)} style={{marginLeft: '5px'}} disabled={t.activeOrders && t.activeOrders.length > 0}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="empty-message">No tables defined yet.</p>}
                </div>
            </div>
             <div className="admin-section">
                <h3>Bulk Product Actions</h3>
                 <div className="form-group-inline">
                    <button onClick={() => document.getElementById('productImportFileAdmin').click()} className="btn btn-secondary" > Choose JSON File </button>
                     <span id="fileNameLabelAdmin" style={{marginLeft: '10px', color: 'var(--grey)'}}>No file chosen</span>
                </div>
                 <input type="file" id="productImportFileAdmin" accept=".json" style={{display: 'none'}} onChange={handleFileChange} />
                <button onClick={triggerImport} className="btn btn-primary" style={{marginTop: '10px'}} disabled={!selectedFile} > Import Products (Replace All) </button>
                <button onClick={onExportProducts} className="btn btn-info" style={{marginTop: '10px', marginLeft: '10px'}} disabled={products.length === 0} > Export All Products (CSV) </button>
            </div>
            <div className="admin-section product-list">
                <h3>Current Products ({products.length})</h3>
                {products.length > 0 ? (
                    <table>
                        <thead>
                            <tr><th>Image</th><th>Name</th><th>Type</th><th>Category</th><th>Base Price</th><th>Stock</th><th>Status</th><th>Options</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} style={{backgroundColor: p.isArchived ? 'var(--light-grey)' : 'transparent', opacity: p.isArchived ? 0.6 : 1}}>
                                    <td className="product-list-image-cell">
                                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex';}} /> : null }
                                         <span style={{ fontSize: '24px', display: p.imageUrl ? 'none' : 'flex' }}>{p.image}</span>
                                    </td>
                                    <td>{p.name}</td>
                                    <td>{p.productType === 'bundle' ? 'Bundle' : 'Standard'}</td>
                                    <td>{p.category}</td><td>${p.price.toFixed(2)}</td>
                                    <td>{p.productType === 'bundle' ? calculateBundleAvailability(p, products) + ' (calc.)' : p.stock}</td>
                                    <td className={`product-availability-status ${p.isArchived ? 'status-archived' : (p.isTemporarilyUnavailable ? 'status-unavailable' : 'status-available')}`}>
                                        {p.isArchived ? 'Archived' : (p.isTemporarilyUnavailable ? 'Unavailable' : 'Available')}
                                    </td>
                                    <td className="product-options-display">
                                        {p.productType === 'bundle' && p.bundleItems.length > 0 && `Items: ${p.bundleItems.length}`}
                                        {p.productType === 'standard' && (p.variationGroups?.length > 0 || p.modifierGroups?.length > 0) && `${p.variationGroups.map(vg => vg.name).join(', ')}${p.variationGroups.length > 0 && p.modifierGroups.length > 0 ? '; ' : ''}${p.modifierGroups.map(mg => mg.name).join(', ')}`}
                                        {p.productType === 'standard' && (!p.variationGroups || p.variationGroups.length === 0) && (!p.modifierGroups || p.modifierGroups.length === 0) && "None"}
                                    </td>
                                    <td>
                                        <button className="btn btn-edit btn-sm" onClick={() => handleEditClick(p)} disabled={p.isArchived}>Edit</button>
                                        {p.isArchived ? (<button className="btn btn-unarchive btn-sm" onClick={() => unarchiveProduct(p.id)}>Unarchive</button>) : (<button className="btn btn-archive btn-sm" onClick={() => archiveProduct(p.id)}>Archive</button>)}
                                        <button className="btn btn-danger btn-sm" onClick={() => removeProduct(p.id)} style={{marginLeft: '5px'}}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="empty-message">No products defined yet.</p>}
            </div>
        </div>
    );
}
function DashboardView({ orderHistory, products, customers }) {
    const [dateFilter, setDateFilter] = React.useState({ from: '', to: '' });

    // Filter orders by date
    const filteredOrders = React.useMemo(() => {
        if (!dateFilter.from && !dateFilter.to) return orderHistory;
        return orderHistory.filter(order => {
            const orderDate = new Date(order.date);
            const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
            const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
            if (fromDate && orderDate < fromDate) return false;
            if (toDate) {
                // Include the whole day for 'to'
                toDate.setHours(23,59,59,999);
                if (orderDate > toDate) return false;
            }
            return true;
        });
    }, [orderHistory, dateFilter]);

    // --- Calculations (use filteredOrders instead of orderHistory) ---
    const activeProducts = products.filter(p => !p.isArchived);
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalDiscountsGiven = filteredOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const totalUniqueCustomers = [...new Set(filteredOrders.map(o => o.customerId).filter(Boolean))].length;

    // Sales by Category
    const categorySales = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const productDetails = products.find(p => p.id === item.productId);
            const category = productDetails ? productDetails.category : 'Uncategorized (Product Removed)';
            categorySales[category] = (categorySales[category] || 0) + (item.itemPriceWithModifiers * item.quantity);
        });
    });
    const salesByCategory = Object.entries(categorySales).sort(([,a],[,b]) => b-a);

    // Payment Methods
    const paymentMethodStats = {};
    filteredOrders.forEach(order => {
        if (order.paymentMethodsUsed && Array.isArray(order.paymentMethodsUsed)) {
            order.paymentMethodsUsed.forEach(pm => {
                const method = pm.method || 'Other';
                if (!paymentMethodStats[method]) paymentMethodStats[method] = { count: 0, total: 0 };
                paymentMethodStats[method].count += 1;
                paymentMethodStats[method].total += pm.amount;
            });
        } else if (order.paymentMethod) {
            const method = order.paymentMethod || 'Other';
            if (!paymentMethodStats[method]) paymentMethodStats[method] = { count: 0, total: 0 };
            paymentMethodStats[method].count += 1;
            paymentMethodStats[method].total += order.total;
        }
    });

    // Top Items by Quantity
    const itemQtyMap = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            itemQtyMap[item.displayName] = (itemQtyMap[item.displayName] || 0) + item.quantity;
        });
    });
    const itemSalesByQuantity = Object.entries(itemQtyMap).sort(([,a],[,b]) => b-a);

    // Top Items by Revenue
    const itemRevenueMap = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            itemRevenueMap[item.displayName] = (itemRevenueMap[item.displayName] || 0) + (item.itemPriceWithModifiers * item.quantity);
        });
    });
    const itemSalesByRevenue = Object.entries(itemRevenueMap).sort(([,a],[,b]) => b-a);

    // Low Stock Items
    const lowStockItems = activeProducts.filter(p => p.productType === 'standard' && !p.isTemporarilyUnavailable && p.stock > 0 && p.stock <= p.minStock);

    // --- Chart rendering ---
   React.useEffect(() => {
    let salesChartInstance = null;
    let paymentChartInstance = null;

    // Destroy previous chart if exists
    if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
    }
    if (window.paymentChartInstance) {
        window.paymentChartInstance.destroy();
    }

    // Sales by Category Bar Chart
    if (window.Chart && document.getElementById('salesByCategoryChart')) {
        window.salesChartInstance = new Chart(document.getElementById('salesByCategoryChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: salesByCategory.map(([category]) => category),
                datasets: [{
                    label: 'Sales ($)',
                    data: salesByCategory.map(([, amount]) => amount),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Payment Methods Pie Chart
    if (window.Chart && document.getElementById('paymentMethodsChart')) {
        window.paymentChartInstance = new Chart(document.getElementById('paymentMethodsChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: Object.keys(paymentMethodStats),
                datasets: [{
                    data: Object.values(paymentMethodStats).map(stat => stat.total),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Cleanup on unmount or before next render
    return () => {
        if (window.salesChartInstance) {
            window.salesChartInstance.destroy();
            window.salesChartInstance = null;
        }
        if (window.paymentChartInstance) {
            window.paymentChartInstance.destroy();
            window.paymentChartInstance = null;
        }
    };
}, [salesByCategory, paymentMethodStats]);

    // --- Dashboard HTML ---
    return (
        <div className="dashboard-container">
            <h2>Dashboard</h2>
            <div className="dashboard-filter" style={{marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'center'}}>
                <label>From: <input type="date" value={dateFilter.from} onChange={e => setDateFilter(f => ({...f, from: e.target.value}))} /></label>
                <label>To: <input type="date" value={dateFilter.to} onChange={e => setDateFilter(f => ({...f, to: e.target.value}))} /></label>
                {(dateFilter.from || dateFilter.to) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter({from: '', to: ''})}>Clear</button>
                )}
            </div>
            <div className="dashboard-grid">
                <div className="dashboard-card"><h3>Total Sales</h3><p className="metric-value">${totalSales.toFixed(2)}</p></div>
                <div className="dashboard-card"><h3>Total Orders</h3><p className="metric-value">{totalOrders}</p></div>
                <div className="dashboard-card"><h3>Avg. Order Value</h3><p className="metric-value">${averageOrderValue.toFixed(2)}</p></div>
                <div className="dashboard-card"><h3>Total Discounts</h3><p className="metric-value">${totalDiscountsGiven.toFixed(2)}</p></div>
                <div className="dashboard-card"><h3>Total Customers</h3><p className="metric-value">{totalUniqueCustomers}</p></div>
                {/* --- Chart.js canvases --- */}
                <div className="dashboard-card">
                    <h3>Sales by Category</h3>
                    <canvas id="salesByCategoryChart" width="400" height="200"></canvas>
                </div>
                <div className="dashboard-card">
                    <h3>Payment Methods</h3>
                    <canvas id="paymentMethodsChart" width="400" height="200"></canvas>
                </div>
                {/* --- Top Items by Quantity --- */}
                <div className="dashboard-card"><h3>Top Items by Quantity (Top 5)</h3>{itemSalesByQuantity.length > 0 ? (<ul>{itemSalesByQuantity.slice(0,5).map(([name, qty]) => <li key={name}><span>{name}</span> <span>{qty} sold</span></li>)}</ul>) : <p className="empty-message" style={{fontSize: '14px', padding: '0'}}>No sales data.</p>}</div>
                {/* --- Top Items by Revenue --- */}
                <div className="dashboard-card"><h3>Top Items by Revenue (Top 5)</h3>{itemSalesByRevenue.length > 0 ? (<ul>{itemSalesByRevenue.slice(0,5).map(([name, revenue]) => <li key={name}><span>{name}</span> <span>${revenue.toFixed(2)}</span></li>)}</ul>) : <p className="empty-message" style={{fontSize: '14px', padding: '0'}}>No sales data.</p>}</div>
                {/* --- Low Stock Items --- */}
                <div className="dashboard-card"><h3>Low Stock Items ({lowStockItems.length})</h3>{lowStockItems.length > 0 ? (<ul style={{maxHeight: '150px', overflowY: 'auto'}}>{lowStockItems.map(item => <li key={item.id} style={{color: item.stock === 0 ? 'var(--danger)' : (item.stock < item.minStock / 2 ? 'var(--danger)' : 'var(--warning)')}}><span>{item.name}</span> <span>{item.stock} left (min {item.minStock})</span></li>)}</ul>) : <p className="empty-message" style={{fontSize: '14px', padding: '0'}}>All items well stocked.</p>}</div>
            </div>
        </div>
    );
}
// ...existing code...
function OrderHistoryView({ orderHistory, markOrderAsDelivered, tables, onResumeOrder, onInitiateReturn }) {
     return (
        <div className="history-container">
            <h2>Order History</h2>
            {orderHistory.length === 0 ? (<p className="empty-message">No orders yet</p>) : (
                <div className="history-order-grid">
                    {orderHistory.slice().reverse().map(order => {
                        const isReturnable = order.status === 'Paid' || order.status === 'Delivered';
                        let orderDisplayStatus = order.status;
                        if (order.type === 'return') {
                            orderDisplayStatus = `Returned (Ref. #${order.originalOrderId?.slice(0,6)})`;
                        } else if (order.returnedItems && order.returnedItems.length > 0) {
                            const allItemsReturned = order.items.every(item => {
                                const returnedItem = order.returnedItems.find(ri => ri.orderItemId === item.orderItemId);
                                return returnedItem && returnedItem.quantity >= item.quantity;
                            });
                            if (allItemsReturned) {
                                orderDisplayStatus = 'Fully Returned';
                            } else {
                                orderDisplayStatus = 'Partially Returned';
                            }
                        }

                        // --- FIX: More robust check for partial/multiple returns ---
                        const hasReturnableItems = order.items.some(item => {
                            const totalReturned = (order.returnedItems || [])
                                .filter(ri => ri.orderItemId === item.orderItemId)
                                .reduce((sum, ri) => sum + (ri.quantity || 0), 0);
                            return totalReturned < item.quantity;
                        });

                        return (
                        <div key={order.id} className={`history-order-card ${order.type === 'return' ? 'return-order-card' : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                                <h3 style={{ margin: 0 }}>{order.type === 'return' ? 'Return ' : 'Order '}#{order.id.slice(0, 8)}</h3>
                                <span className={`order-status ${orderDisplayStatus ? orderDisplayStatus.toLowerCase().replace(/[\s/_()#]+/g, '-') : 'processing'}`}>
                                    {orderDisplayStatus === 'Suspended' ? 'Suspended' : (orderDisplayStatus ? orderDisplayStatus.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim() : 'Processing')}
                                </span>
                            </div>
                            <p>Table: {order.tableId && tables ? tables.find(t=>t.id === order.tableId)?.name || 'N/A' : (order.status === 'Suspended' && !order.tableId ? 'Suspended Walk-in' : 'Walk-in/Takeaway')}</p>
                            <p>Order Label/Customer: {order.linkedActiveOrderLabel || order.customer} {order.customerId ? `(ID: ${order.customerId.slice(0,6)})` : ''}</p>
                            <p>Date: {new Date(order.date).toLocaleString()}</p>
                            <p>Payment(s): {
                                order.paymentMethodsUsed && order.paymentMethodsUsed.length > 0
                                ? order.paymentMethodsUsed.map(pm => `${pm.method.charAt(0).toUpperCase() + pm.method.slice(1)} ($${pm.amount.toFixed(2)})${pm.method === 'loyalty' && pm.points ? ` (${pm.points} pts)` : ''}`).join(', ')
                                : (order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A')
                            }</p>
                            <p>Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                            <ul>{order.items.map(item => (
                                <li key={item.orderItemId || item.productId + (item.selectedOptions ? item.selectedOptions.map(o=>o.optionId).join('') : '')}>
                                    <span>{item.displayName} x{item.quantity}</span>
                                    <span>(${(item.itemPriceWithModifiers).toFixed(2)})</span>
                                    {item.productType === 'bundle' && item.bundleComponentDetails && item.bundleComponentDetails.length > 0 && (item.bundleComponentDetails.map((detail, idx) => (<div key={idx} className="bundle-component-display">&nbsp;&nbsp;&nbsp;<em>↳ {detail}</em></div>)))}
                                    {item.productType !== 'bundle' && item.selectedOptions && item.selectedOptions.length > 0 && (<div className="item-options-display">{item.selectedOptions.map(opt => `${opt.optionName}`).join(', ')}</div>)}
                                </li>
                            ))}</ul>
                            {order.notes && <p className="order-notes-display-history"><strong>Notes:</strong> {order.notes}</p>}
                             {order.returnedItems && order.returnedItems.length > 0 && (
                                <div className="returned-items-history">
                                    <strong>Returned Items:</strong>
                                    <ul>
                                        {order.returnedItems.map(ri => (
                                            <li key={ri.orderItemId}>
                                                {ri.displayName} x{ri.quantity} (-${(ri.priceAtReturn * ri.quantity).toFixed(2)})
                                            </li>
                                        ))}
                                    </ul>
                                    {order.returnReason && <p><em>Reason: {order.returnReason}</em></p>}
                                </div>
                            )}
                            <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee'}}>
                                <p>Subtotal: ${order.subtotal.toFixed(2)}</p>
                                { (order.appliedDiscountInfo && order.appliedDiscountInfo.value > 0 ? order.discount : order.discount) > 0 && <p>Discount: -${(order.appliedDiscountInfo && order.appliedDiscountInfo.value > 0 ? order.discount : order.discount).toFixed(2)}</p>}
                                <p>Tax: ${order.tax.toFixed(2)}</p>
                                <p style={{fontWeight: 'bold'}}>Total: ${order.total.toFixed(2)}</p>
                                {order.type === 'return' && <p style={{fontWeight: 'bold', color: 'var(--danger)'}}>Refunded Amount: -${order.total.toFixed(2)}</p>}
                            </div>
                            {order.status === 'Suspended' && (
                                <button className="btn btn-primary" onClick={() => onResumeOrder(order.id)} style={{marginTop: '10px'}}>Resume Order</button>
                            )}
                            {(order.status === 'ReadyForDeliveryPickup' || order.status === 'ActiveTableOrder' || order.status === 'BillRequestedTableOrder') && (
                                <button className="btn btn-mark-delivered" onClick={() => markOrderAsDelivered(order.id)} style={{marginTop: '10px'}}> Mark as Delivered/Collected </button>
                            )}
                            {isReturnable && order.type === 'sale' && hasReturnableItems && (
                                <button className="btn btn-warning" onClick={() => onInitiateReturn(order)} style={{marginTop: '10px'}}>Return Items</button>
                            )}
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
}

function KitchenDisplayView({ kitchenOrders, markOrderComplete }) {
    const pendingOrders = kitchenOrders.filter(o => o.status === 'Pending').sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const completedOrders = kitchenOrders.filter(o => o.status === 'Completed').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,5);

    return (
        <div className="kds-container">
            <h2>Kitchen Display System</h2>
            {pendingOrders.length === 0 && completedOrders.length === 0 && <p className="empty-message">No kitchen orders yet.</p>}
            {pendingOrders.length > 0 && (<><h3>Pending Orders ({pendingOrders.length})</h3><div className="kitchen-order-grid">
                {pendingOrders.map(order => (
                    <div key={order.id} className="kitchen-order">
                        <h3>Order Ticket #{order.id.slice(0,6)}</h3>
                        <p>For: {order.customer} (Main Order: #{order.mainOrderId.slice(0,6)})</p>
                        <p>Time: {new Date(order.timestamp).toLocaleTimeString()}</p>
                        <ul>{order.items.map(item => ( <li key={item.id + '-' + order.id}> {item.name} x{item.quantity} {item.options && <div style={{fontSize: '0.9em', color: 'var(--grey)'}}>&nbsp;&nbsp;({item.options})</div>} </li> ))}</ul>
                        {order.notes && <p className="order-notes-display-kds"><strong>Notes:</strong> {order.notes}</p>}
                        <button className="complete-btn" onClick={() => markOrderComplete(order.id)}>Mark as Complete</button>
                    </div>
                ))}
            </div></>)}
            {completedOrders.length > 0 && (<><h3 style={{marginTop: '30px', marginBottom: '15px', borderTop: '1px solid #ccc', paddingTop: '20px'}}>Recently Completed (Kitchen)</h3><div className="kitchen-order-grid">
                {completedOrders.map(order => (
                    <div key={order.id} className="kitchen-order" style={{borderColor: 'var(--grey)', opacity: 0.7}}>
                        <h3>Order Ticket #{order.id.slice(0,6)}</h3>
                        <p>For: {order.customer} (Main Order: #{order.mainOrderId.slice(0,6)})</p>
                        <p>Time: {new Date(order.timestamp).toLocaleTimeString()}</p>
                        <ul>{order.items.map(item => ( <li key={item.id + '-' + order.id}>{item.name} x{item.quantity} {item.options && <div style={{fontSize: '0.9em', color: 'var(--grey)'}}>&nbsp;&nbsp;({item.options})</div>}</li> ))}</ul>
                        {order.notes && <p className="order-notes-display-kds"><strong>Notes:</strong> {order.notes}</p>}
                    </div>
                ))}
            </div></>)}
        </div>
    );
}

function SupportView({ addSupportTicket, supportTickets, emailJsReady }) {
    const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const recipientEmail = "ahmdmo2010@gmail.com";

    const handleInquiryChange = (e) => { const { name, value } = e.target; setInquiryForm(prev => ({ ...prev, [name]: value })); };
    const handleInquirySubmit = (e) => {
        e.preventDefault();
        if (!inquiryForm.name.trim() || !inquiryForm.message.trim()) { alert("Please enter your name and inquiry message."); return; }
        const isEmailJsConfigured = EMAILJS_SERVICE_ID && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' && EMAILJS_TEMPLATE_ID && EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' && EMAILJS_USER_ID && EMAILJS_USER_ID !== 'YOUR_USER_ID_PUBLIC_KEY';
        if (!isEmailJsConfigured) {
            alert("EmailJS is not fully configured with your service details. Your inquiry will be saved locally only.");
            addSupportTicket({...inquiryForm, email_status: 'Not configured, saved locally'});
            setInquiryForm({ name: '', email: '', message: '' }); setShowConfirmation(true); setTimeout(() => setShowConfirmation(false), 7000); return;
        }
        setIsSubmitting(true);
        const templateParams = { from_name: inquiryForm.name, from_email: inquiryForm.email || 'Not provided', to_name: 'Cafe POS Admin', message: inquiryForm.message };
        if (typeof emailjs !== 'undefined' && typeof emailjs.send === 'function' && emailJsReady) {
            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
                .then((response) => { addSupportTicket({...inquiryForm, email_status: 'Sent successfully'}); setShowConfirmation(true); setInquiryForm({ name: '', email: '', message: '' }); })
                .catch((error) => { addSupportTicket({...inquiryForm, email_status: 'Send failed, saved locally'}); alert('Failed to send email. Inquiry saved locally. Error: ' + JSON.stringify(error));})
                .finally(() => { setIsSubmitting(false); setTimeout(() => setShowConfirmation(false), 7000); });
        } else {
            let alertMessage = "EmailJS could not be used for sending. Inquiry saved locally. ";
            if(!emailJsReady) alertMessage += "Reason: EmailJS not initialized. ";
            if(typeof emailjs === 'undefined' || typeof emailjs.send !== 'function') alertMessage += "Reason: EmailJS SDK not loaded or send function missing.";
            alert(alertMessage); addSupportTicket({...inquiryForm, email_status: 'EmailJS not ready/loaded, saved locally'});
            setIsSubmitting(false); setShowConfirmation(true); setTimeout(() => setShowConfirmation(false), 7000);
        }
    };
    return (
        <div className="support-container">
            <h2>Support & Help</h2>
            <section className="support-section"><h3>Submit an Inquiry</h3><p>If EmailJS is configured with your details, your inquiry will be sent to <strong>{recipientEmail}</strong>. All inquiries are also saved locally for your reference.</p>
                <form onSubmit={handleInquirySubmit} className="support-form">
                    <div className="form-group"><label htmlFor="inquiryName" className="form-label">Your Name:</label><input type="text" id="inquiryName" name="name" value={inquiryForm.name} onChange={handleInquiryChange} className="form-input" required disabled={isSubmitting} /></div>
                    <div className="form-group"><label htmlFor="inquiryEmail" className="form-label">Your Email (Optional for local, recommended for email):</label><input type="email" id="inquiryEmail" name="email" value={inquiryForm.email} onChange={handleInquiryChange} className="form-input" disabled={isSubmitting} /></div>
                    <div className="form-group"><label htmlFor="inquiryMessage" className="form-label">Message:</label><textarea id="inquiryMessage" name="message" value={inquiryForm.message} onChange={handleInquiryChange} className="form-textarea" rows="5" required disabled={isSubmitting} /></div>
                    <button type="submit" className="btn btn-primary" style={{alignSelf: 'flex-start'}} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Inquiry'}</button>
                </form>
                {showConfirmation && (<div className="confirmation-message">Your inquiry has been processed and saved locally. Check email status if configured.</div>)}
            </section>
            {supportTickets && supportTickets.length > 0 && (<section className="support-section"><h3>Your Submitted Inquiries (Local Log - Last 5)</h3><ul style={{listStyle: 'none', paddingLeft: 0}}>{supportTickets.slice(0, 5).map(ticket => ( <li key={ticket.id} style={{borderBottom: '1px solid var(--light-grey)', padding: '10px 0'}}><p><strong>Name:</strong> {ticket.name} {ticket.email && `(${ticket.email})`}</p><p><strong>Message:</strong> {ticket.message.substring(0,100)}{ticket.message.length > 100 ? '...' : ''}</p><p style={{fontSize: '12px', color: 'var(--grey)'}}>Submitted: {new Date(ticket.timestamp).toLocaleString()} (Status: {ticket.status || 'Open'}){ticket.email_status && ` - Email: ${ticket.email_status}`}</p></li>))}</ul></section>)}
            <section className="support-section"><h3>FAQs</h3><div className="faq-item"><h4>Q: How do I add a new product?</h4><p>A: Navigate to the 'Admin' tab, fill out the 'Add New Product' form, and click 'Add Product'.</p></div><div className="faq-item"><h4>Q: How do product variations and modifiers work?</h4><p>A: Define them in the 'Admin' panel when adding/editing a product. When adding the product to an order in the 'POS' tab, a modal will appear to select these options, and the price will adjust accordingly.</p></div></section>
            <section className="support-section"><h3>Troubleshooting</h3><ul><li><strong>Application not loading or behaving unexpectedly?</strong> Try refreshing the page. Check the browser's developer console (usually F12) for any error messages.</li><li><strong>EmailJS inquiries not sending?</strong> Ensure you have replaced the placeholder `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, and `EMAILJS_USER_ID` in the `POS Main.js` file with your actual EmailJS account details. Also, check your EmailJS dashboard for any issues.</li></ul></section>
        </div>
    );
}

function CustomersView({ customers, addCustomer, updateCustomer, removeCustomer, orderHistory, onCustomerAddedFromPOS }) {
    const initialFormState = { id: null, name: '', email: '', phone: '', loyaltyPoints: 0, notes: '', createdAt: '', lastVisit: '' };
    const [customerForm, setCustomerForm] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingOrdersForCustomer, setViewingOrdersForCustomer] = useState(null);
    const [customerOrderHistory, setCustomerOrderHistory] = useState([]);

    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        return customers.filter(customer =>
            (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.phone && customer.phone.includes(searchTerm))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [customers, searchTerm]);

    const handleInputChange = (e) => { const { name, value, type } = e.target; setCustomerForm(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value })); };
    const resetForm = () => { setCustomerForm(initialFormState); setIsEditing(false); };
    const handleEditClick = (customer) => { setIsEditing(true); setCustomerForm({ ...customer, loyaltyPoints: customer.loyaltyPoints || 0, notes: customer.notes || '', lastVisit: customer.lastVisit || '' }); setViewingOrdersForCustomer(null); window.scrollTo(0,0); };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!customerForm.name.trim()) { alert("Customer name is required."); return; }
        const customerData = { name: customerForm.name.trim(), email: customerForm.email.trim(), phone: customerForm.phone.trim(), loyaltyPoints: parseInt(customerForm.loyaltyPoints) || 0, notes: customerForm.notes.trim() };
        let newCustomerId;
        if (isEditing) {
            updateCustomer(customerForm.id, customerData);
        } else {
            newCustomerId = addCustomer(customerData); // addCustomer should return the new customer's ID
        }
        resetForm();
        if (onCustomerAddedFromPOS && newCustomerId) { // If callback exists (meaning we came from POS)
            onCustomerAddedFromPOS(newCustomerId);
        }
    };
    const handleRemoveClick = (customerId) => { removeCustomer(customerId); if (viewingOrdersForCustomer && viewingOrdersForCustomer.id === customerId) { setViewingOrdersForCustomer(null); setCustomerOrderHistory([]); } };
    const handleViewOrdersClick = (customer) => { setViewingOrdersForCustomer(customer); const orders = orderHistory.filter(order => order.customerId === customer.id).sort((a,b) => new Date(b.date) - new Date(a.date)); setCustomerOrderHistory(orders); };

    return (
        <div className="customers-container">
            <h2>Customer Management</h2>
            <div className="admin-section"><h3>{isEditing ? `Edit Customer: ${customerForm.name}` : 'Add New Customer'}</h3>
                <form onSubmit={handleSubmit} className="product-management-form">
                    <div className="form-group"><label className="form-label">Name:</label><input type="text" name="name" value={customerForm.name} onChange={handleInputChange} className="form-input" required /></div>
                    <div className="form-group"><label className="form-label">Email:</label><input type="email" name="email" value={customerForm.email} onChange={handleInputChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Phone:</label><input type="tel" name="phone" value={customerForm.phone} onChange={handleInputChange} className="form-input" /></div>
                    <div className="form-group">
                        <label className="form-label">Loyalty Points:</label>
                        <input
                            type="number"
                            name="loyaltyPoints"
                            value={customerForm.loyaltyPoints}
                            onChange={handleInputChange}
                            className="form-input"
                            min="0"
                            disabled={isEditing}
                        />
                        {isEditing && <small className="form-text text-muted">Loyalty points are updated via transactions.</small>}
                    </div>
                    <div className="form-group form-group-full"><label className="form-label">Notes:</label><textarea name="notes" value={customerForm.notes} onChange={handleInputChange} className="form-textarea" rows="3" /></div>
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" style={{width: 'auto', paddingLeft: '30px', paddingRight: '30px'}}>{isEditing ? 'Update Customer' : 'Add Customer'}</button>
                        {isEditing && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel Edit</button>}
                    </div>
                </form>
            </div>
            <div className="admin-section"><h3>Search Customers</h3><input type="text" placeholder="Search by name, email, or phone..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="admin-section customer-list"><h3>Customer Directory ({filteredCustomers.length})</h3>
                {filteredCustomers.length > 0 ? (<table><thead><tr><th>Name</th><th>Contact</th><th>Loyalty</th><th>Date Added</th><th>Last Visit</th><th>Actions</th></tr></thead>
                    <tbody>{filteredCustomers.map(customer => ( <tr key={customer.id}><td><strong>{customer.name}</strong>{customer.notes && <div style={{fontSize: '0.8em', color: 'var(--grey)'}}>{customer.notes.substring(0, 30)}{customer.notes.length > 30 ? '...' : ''}</div>}</td><td>{customer.email && <div>{customer.email}</div>}{customer.phone && <div>{customer.phone}</div>}</td><td>{customer.loyaltyPoints || 0} pts</td><td>{new Date(customer.createdAt).toLocaleDateString()}</td><td>{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}</td><td><button className="btn btn-edit btn-sm" onClick={() => handleEditClick(customer)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => handleRemoveClick(customer.id)} style={{marginLeft: '5px'}}>Remove</button><button className="btn btn-info btn-sm" onClick={() => handleViewOrdersClick(customer)} style={{marginLeft: '5px'}}>View Orders</button></td></tr>))}</tbody>
                </table>) : <p className="empty-message">No customers found.</p>}
            </div>
            {viewingOrdersForCustomer && (<div className="admin-section"><h3>Order History for {viewingOrdersForCustomer.name}</h3>
                {customerOrderHistory.length > 0 ? (<div className="history-order-grid">{customerOrderHistory.map(order => ( <div key={order.id} className="history-order-card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}><h3 style={{ margin: 0 }}>Order #{order.id.slice(0, 8)}</h3><span className={`order-status ${order.status ? order.status.toLowerCase().replace(/[\s/]+/g, '-') : 'processing'}`}>{order.status || 'Processing'}</span></div><p>Date: {new Date(order.date).toLocaleString()}</p><p>Total: ${order.total.toFixed(2)}</p><ul>{order.items.map(item => ( <li key={item.orderItemId || item.productId}><span>{item.displayName} x{item.quantity}</span><span>(${(item.itemPriceWithModifiers).toFixed(2)})</span></li>))}</ul></div>))}</div>) : <p className="empty-message">No orders found for this customer.</p>}
                <button className="btn btn-secondary" style={{marginTop: '15px'}} onClick={() => setViewingOrdersForCustomer(null)}>Close Order History</button>
            </div>)}
        </div>
    );
}

// --- AddCustomerModalPOS Component ---
function AddCustomerModalPOS({ onClose, onAddCustomerAndSelect, initialPhone = '' }) {
    const initialFormState = { name: '', email: '', phone: initialPhone, notes: '' };
    const [customerForm, setCustomerForm] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!customerForm.name.trim()) {
            alert("Customer name is required.");
            return;
        }
        setIsSubmitting(true);
        // Here, we'd typically call a function passed via props to add the customer
        // This function should handle adding to the main customers list and then selecting
        onAddCustomerAndSelect({
            name: customerForm.name.trim(),
            email: customerForm.email.trim(),
            phone: customerForm.phone.trim(),
            notes: customerForm.notes.trim()
        });
        // No need to reset form here as the modal will close
        // setIsSubmitting(false); // This would be handled by the parent closing the modal
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
                <div className="modal-header">
                    <h3 className="modal-title">Add New Customer</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-content">
                    <form onSubmit={handleSubmit} className="product-management-form" style={{gridTemplateColumns: '1fr'}}>
                        <div className="form-group">
                            <label className="form-label">Name:</label>
                            <input type="text" name="name" value={customerForm.name} onChange={handleInputChange} className="form-input" required disabled={isSubmitting} autoFocus/>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone:</label>
                            <input type="tel" name="phone" value={customerForm.phone} onChange={handleInputChange} className="form-input" disabled={isSubmitting}/>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email (Optional):</label>
                            <input type="email" name="email" value={customerForm.email} onChange={handleInputChange} className="form-input" disabled={isSubmitting}/>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes (Optional):</label>
                            <textarea name="notes" value={customerForm.notes} onChange={handleInputChange} className="form-textarea" rows="2" disabled={isSubmitting}/>
                        </div>
                        <div className="modal-actions" style={{marginTop: '10px'}}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add Customer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


function TableView({ tables, onOpenTableActions, selectedTableId, selectedOrderId }) {
    return (
        <div className="tables-container">
            <h2>Tables</h2>
            {tables.length === 0 ? (
                <p className="empty-message">No tables defined. Add tables in the Admin panel.</p>
            ) : (
                <div className="table-grid">
                    {tables.map(table => {
                        const hasActiveOrders = table.activeOrders && table.activeOrders.length > 0;
                        const isSelectedForCurrentPOSOrder = selectedTableId === table.id && table.activeOrders.some(ao => ao.orderId === selectedOrderId);
                        let displayStatus = table.status;
                        if (hasActiveOrders) displayStatus = 'occupied';

                        let cardClass = `table-card status-${displayStatus.replace(/_/g, '-')}`;
                        if (isSelectedForCurrentPOSOrder) cardClass += ' status-selected-for-order';
                        else if (selectedTableId === table.id && !selectedOrderId && displayStatus === 'available') cardClass += ' status-selected';

                        return (
                            <div key={table.id} className={cardClass} onClick={() => onOpenTableActions(table.id)}>
                                <h4>{table.name}</h4>
                                <p>Capacity: {table.capacity}</p>
                                <p className="table-status-text" style={{textTransform: 'capitalize'}}>
                                    {displayStatus.replace(/_/g, ' ')}
                                    {hasActiveOrders && ` (${table.activeOrders.length} order${table.activeOrders.length > 1 ? 's' : ''})`}
                                </p>
                                {hasActiveOrders && (
                                    <div className="table-active-orders-summary">
                                        {table.activeOrders.slice(0,2).map(ao => (
                                            <div key={ao.orderId} className={`active-order-line ${ao.status === 'suspended' ? 'suspended-order-line' : ''}`}>
                                                <span>{ao.displayLabel.substring(0,15)}{ao.displayLabel.length > 15 ? '...' : ''}</span>
                                                <span>{ao.status === 'suspended' ? '(Suspended)' : `$${ao.total.toFixed(2)}`}</span>
                                            </div>
                                        ))}
                                        {table.activeOrders.length > 2 && <div>...and {table.activeOrders.length - 2} more</div>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function TableActionsModal({
    table,
    orderHistory,
    onClose,
    onUpdateTableGeneralStatus,
    onStartNewDistinctOrder,
    onViewDistinctOrder,
    onRequestBillForDistinctOrder,
    onReopenDistinctOrder
}) {
    if (!table) return null;
    const [newOrderLabel, setNewOrderLabel] = useState('');
    const handleStartNewOrder = () => {
        onStartNewDistinctOrder(table.id, newOrderLabel.trim() || `Order ${generateId().slice(0,4)}`);
        setNewOrderLabel('');
    };
    const tableOverallStatus = (table.activeOrders && table.activeOrders.length > 0) ? 'occupied' : table.status;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal table-actions-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                     <h3 className="modal-title">Table: {table.name}
                        <span style={{fontSize: '0.8em', fontWeight: 'normal', marginLeft: '10px'}}>
                            ({tableOverallStatus.replace(/_/g, ' ')})
                        </span>
                    </h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-content">
                    {table.activeOrders && table.activeOrders.length > 0 && (
                        <div className="active-orders-section">
                            <h4>Active Orders on this Table:</h4>
                            {table.activeOrders.map(activeOrder => {
                                const fullOrderDetails = orderHistory.find(o => o.id === activeOrder.orderId);
                                const isSuspended = activeOrder.status === 'suspended';
                                return (
                                    <div key={activeOrder.orderId} className="distinct-order-item">
                                        <div className="distinct-order-info">
                                            <strong>{activeOrder.displayLabel}</strong>
                                            <span>(Total: ${fullOrderDetails?.total.toFixed(2) || activeOrder.total.toFixed(2)})</span>
                                            <span className={`distinct-order-status status-${activeOrder.status}`}>
                                                {isSuspended ? 'Suspended' : activeOrder.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="distinct-order-actions">
                                            {isSuspended ? (
                                                <button className="btn btn-primary btn-sm" onClick={() => onViewDistinctOrder(table.id, activeOrder.orderId)}>Resume Order</button>
                                            ) : activeOrder.status === 'active' ? (
                                                <>
                                                    <button className="btn btn-primary btn-sm" onClick={() => onViewDistinctOrder(table.id, activeOrder.orderId)}>View/Modify</button>
                                                    <button className="btn btn-warning btn-sm" onClick={() => onRequestBillForDistinctOrder(table.id, activeOrder.orderId)}>Send to Checkout</button>
                                                </>
                                            ) : activeOrder.status === 'bill_requested' ? (
                                                <>
                                                    <button className="btn btn-success btn-sm" onClick={() => onViewDistinctOrder(table.id, activeOrder.orderId)}>Go to POS for Payment</button>
                                                    <button className="btn btn-info btn-sm" onClick={() => onReopenDistinctOrder(table.id, activeOrder.orderId)}>Reopen Order</button>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="new-distinct-order-section">
                        <h4>Start New Order on this Table:</h4>
                        <div className="form-group-inline">
                            <input
                                type="text"
                                placeholder="Optional: Order Label (e.g., Guest A)"
                                value={newOrderLabel}
                                onChange={(e) => setNewOrderLabel(e.target.value)}
                                className="form-input"
                            />
                            <button className="btn btn-success" onClick={handleStartNewOrder} disabled={table.status === 'needs_cleaning'}>
                                Start Order
                            </button>
                        </div>
                         {table.status === 'needs_cleaning' && <p style={{color: 'var(--danger)', fontSize: '0.9em'}}>Table needs cleaning before starting new orders.</p>}
                    </div>
                    <div className="general-table-actions-section">
                        <h4>Manage Table Status:</h4>
                        {tableOverallStatus !== 'reserved' && table.status !== 'needs_cleaning' && (
                             <button className="btn btn-info" onClick={() => onUpdateTableGeneralStatus(table.id, 'reserved')}>Mark as Reserved</button>
                        )}
                        {table.status === 'reserved' && (
                            <button className="btn btn-secondary" onClick={() => onUpdateTableGeneralStatus(table.id, 'available')}>Cancel Reservation</button>
                        )}
                        {tableOverallStatus !== 'needs_cleaning' && (!table.activeOrders || table.activeOrders.length === 0) && (
                             <button className="btn btn-danger" onClick={() => onUpdateTableGeneralStatus(table.id, 'needs_cleaning')}>Mark for Cleaning</button>
                        )}
                        {table.status === 'needs_cleaning' && (
                            <button className="btn btn-success" onClick={() => onUpdateTableGeneralStatus(table.id, 'available')}>Mark as Clean & Available</button>
                        )}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

function SettingsView({ settings, onUpdateSettings }) {
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [pinConfirm, setPinConfirm] = useState('');
    const [showPinMismatch, setShowPinMismatch] = useState(false);
    const [logoPreview, setLogoPreview] = useState(settings.cafeLogoUrl);

    useEffect(() => {
        setCurrentSettings(settings);
        setPinConfirm(settings.adminPin || '');
        setLogoPreview(settings.cafeLogoUrl);
    }, [settings]);

    const handleSettingChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        let processedValue;

        if (name === "cafeLogoUrlFile") {
            if (files && files[0]) {
                const reader = new FileReader();
                reader.onload = (upload) => {
                    const dataUrl = upload.target.result;
                    setCurrentSettings(prev => ({ ...prev, cafeLogoUrl: dataUrl }));
                    setLogoPreview(dataUrl);
                };
                reader.readAsDataURL(files[0]);
            }
            return;
        } else {
            processedValue = type === 'checkbox' ? checked : value;
        }


        if (name === "taxRate" || name === "serviceChargeRate") {
            processedValue = parseFloat(value) / 100;
            if (isNaN(processedValue) || processedValue < 0) processedValue = 0;
            if (processedValue > 1) processedValue = 1;
        } else if (name === "adminPin") {
            setShowPinMismatch(false);
        }
        setCurrentSettings(prev => ({ ...prev, [name]: processedValue }));
    };

    const handlePinConfirmChange = (e) => {
        setPinConfirm(e.target.value);
        setShowPinMismatch(false);
    };

    const handleSave = () => {
        if (currentSettings.adminPin && currentSettings.adminPin !== pinConfirm) {
            setShowPinMismatch(true);
            alert("Admin PINs do not match. Please re-enter.");
            return;
        }
        if (!currentSettings.adminPin && pinConfirm) {
            if (currentSettings.adminPin === '' && pinConfirm === '') {
            } else {
                setShowPinMismatch(true);
                alert("Admin PIN cannot be blank if you are trying to set or confirm it. To remove PIN, leave both fields blank.");
                return;
            }
        }
        onUpdateSettings(currentSettings);
        alert("Settings saved!");
    };

    return (
        <div className="settings-container">
            <h2>Settings</h2>
            <div className="settings-group-card">
                <h3>Cafe Information</h3>
                <div className="settings-form-grid">
                    <div className="form-group">
                        <label className="form-label">Cafe Name:</label>
                        <input type="text" name="cafeName" value={currentSettings.cafeName || ''} onChange={handleSettingChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address:</label>
                        <input type="text" name="cafeAddress" value={currentSettings.cafeAddress || ''} onChange={handleSettingChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone:</label>
                        <input type="tel" name="cafePhone" value={currentSettings.cafePhone || ''} onChange={handleSettingChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Website:</label>
                        <input type="url" name="cafeWebsite" value={currentSettings.cafeWebsite || ''} onChange={handleSettingChange} className="form-input" />
                    </div>
                    <div className="form-group form-group-full">
                        <label className="form-label">Logo Image (Upload):</label>
                        <input type="file" name="cafeLogoUrlFile" accept="image/*" onChange={handleSettingChange} className="form-input" />
                        {logoPreview &&
                            <img
                                src={logoPreview}
                                alt="Cafe Logo Preview"
                                className="settings-logo-preview"
                                onError={(e) => { e.target.style.display='none'; const placeholder = document.createElement('span'); placeholder.textContent = 'Invalid Logo URL or Image'; e.target.parentNode.appendChild(placeholder);}}
                                onLoad={(e) => e.target.style.display='block'}
                            />
                        }
                    </div>
                </div>
            </div>
            <div className="settings-group-card">
                <h3>Receipt Settings</h3>
                <div className="settings-form-grid">
                    <div className="form-group form-group-full">
                        <label className="form-label">Receipt Header Message:</label>
                        <input type="text" name="receiptHeaderMsg" value={currentSettings.receiptHeaderMsg || ''} onChange={handleSettingChange} className="form-input" />
                    </div>
                    <div className="form-group form-group-full">
                        <label className="form-label">Receipt Footer Message:</label>
                        <input type="text" name="receiptFooterMsg" value={currentSettings.receiptFooterMsg || ''} onChange={handleSettingChange} className="form-input" />
                    </div>
                    <div className="form-group form-group-checkbox form-group-full">
                        <input type="checkbox" id="showReceiptLogoSettings" name="showReceiptLogo" checked={currentSettings.showReceiptLogo} onChange={handleSettingChange} />
                        <label htmlFor="showReceiptLogoSettings" className="form-label">Show Logo on Receipt</label>
                    </div>
                </div>
            </div>
            <div className="settings-group-card">
                <h3>Financial Settings</h3>
                <div className="settings-form-grid">
                     <div className="form-group">
                        <label className="form-label">Tax Rate (%):</label>
                        <input type="number" name="taxRate" value={(currentSettings.taxRate * 100).toFixed(2)} onChange={handleSettingChange} className="form-input" step="0.01" min="0" max="100" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Service Charge Rate (%):</label>
                        <input type="number" name="serviceChargeRate" value={(currentSettings.serviceChargeRate * 100).toFixed(2)} onChange={handleSettingChange} className="form-input" step="0.01" min="0" max="100" />
                    </div>
                </div>
            </div>
            <div className="settings-group-card">
                <h3>Security</h3>
                 <div className="settings-form-grid">
                    <div className="form-group">
                        <label className="form-label">Admin PIN:</label>
                        <input
                            type="password"
                            name="adminPin"
                            value={currentSettings.adminPin || ''}
                            onChange={handleSettingChange}
                            className="form-input"
                            placeholder="4-8 digits, or blank"
                            pattern="\d{4,8}|"
                            title="Enter 4 to 8 digits, or leave blank for no PIN"
                            maxLength="8"
                        />
                         <small className="form-text-muted">Leave blank for no PIN protection.</small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Admin PIN:</label>
                        <input
                            type="password"
                            name="adminPinConfirm"
                            value={pinConfirm}
                            onChange={handlePinConfirmChange}
                            className={`form-input ${showPinMismatch ? 'input-error' : ''}`}
                            placeholder="Confirm PIN if setting/changing"
                            pattern="\d{4,8}|"
                            maxLength="8"
                        />
                         {showPinMismatch && <small className="error-message">PINs do not match.</small>}
                    </div>
                </div>
            </div>
            <div className="settings-save-button-container">
                <button onClick={handleSave} className="btn btn-primary btn-lg-save">Save Settings</button>
            </div>
        </div>
    );
}

// --- ExpensesView Component ---
function ExpensesView({ expenses, onAddExpense, onRemoveExpense }) {
    const initialExpenseForm = { description: '', amount: '', date: new Date().toISOString().split('T')[0], category: '' };
    const [expenseForm, setExpenseForm] = useState(initialExpenseForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleExpenseChange = (e) => {
        const { name, value } = e.target;
        setExpenseForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddExpenseSubmit = (e) => {
        e.preventDefault();
        if (!expenseForm.description.trim() || !expenseForm.amount || parseFloat(expenseForm.amount) <= 0 || !expenseForm.date) {
            alert("Please fill in Description, a valid Amount, and Date for the expense.");
            return;
        }
        setIsSubmitting(true);
        onAddExpense({
            description: expenseForm.description.trim(),
            amount: parseFloat(expenseForm.amount),
            date: expenseForm.date,
            category: expenseForm.category.trim() || 'Uncategorized'
        });
        setExpenseForm(initialExpenseForm);
        setIsSubmitting(false);
        alert("Expense added!");
    };
    
    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses]);


    return (
        <div className="expenses-container">
            <h2>Manage Expenses</h2>
            <div className="admin-section">
                <h3>Add New Expense</h3>
                <form onSubmit={handleAddExpenseSubmit} className="product-management-form" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'end'}}>
                    <div className="form-group">
                        <label htmlFor="expenseDescription" className="form-label">Description:</label>
                        <input type="text" id="expenseDescription" name="description" value={expenseForm.description} onChange={handleExpenseChange} className="form-input" required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="expenseAmount" className="form-label">Amount ($):</label>
                        <input type="number" id="expenseAmount" name="amount" value={expenseForm.amount} onChange={handleExpenseChange} className="form-input" step="0.01" min="0.01" required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="expenseDate" className="form-label">Date:</label>
                        <input type="date" id="expenseDate" name="date" value={expenseForm.date} onChange={handleExpenseChange} className="form-input" required disabled={isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="expenseCategory" className="form-label">Category (Optional):</label>
                        <input type="text" id="expenseCategory" name="category" value={expenseForm.category} onChange={handleExpenseChange} className="form-input" placeholder="e.g., Supplies, Rent" disabled={isSubmitting} />
                    </div>
                    <div className="form-group" style={{alignSelf: 'end'}}>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting} style={{width: '100%'}}>
                            {isSubmitting ? 'Adding...' : '+ Add Expense'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="admin-section expense-list">
                <h3>Recorded Expenses ({sortedExpenses.length})</h3>
                {sortedExpenses.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th style={{textAlign: 'right'}}>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td>{expense.description}</td>
                                    <td>{expense.category}</td>
                                    <td style={{textAlign: 'right'}}>${expense.amount.toFixed(2)}</td>
                                    <td>
                                        <button className="btn btn-danger btn-sm" onClick={() => onRemoveExpense(expense.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="empty-message">No expenses recorded yet.</p>}
            </div>
        </div>
    );
}

// ...existing code...

// --- ReturnItemsModal Component ---
function ReturnItemsModal({ order, onClose, onProcessReturn }) {
    const [selectedReturns, setSelectedReturns] = React.useState([]);
    const [reason, setReason] = React.useState('');
    const [refundAmount, setRefundAmount] = React.useState(0);

    // Calculate max returnable for each item
    const getMaxReturnable = (item) => {
        const alreadyReturned = (order.returnedItems || [])
            .filter(ri => ri.orderItemId === item.orderItemId)
            .reduce((sum, ri) => sum + (ri.quantity || 0), 0);
        return item.quantity - alreadyReturned;
    };

    // Handle checkbox and quantity change
    const handleSelect = (item, checked) => {
        if (checked) {
            setSelectedReturns(prev => [
                ...prev,
                {
                    ...item,
                    quantityReturned: 1,
                    priceAtReturn: item.itemPriceWithModifiers,
                }
            ]);
        } else {
            setSelectedReturns(prev => prev.filter(ri => ri.orderItemId !== item.orderItemId));
        }
    };

    const handleQtyChange = (item, qty) => {
        setSelectedReturns(prev =>
            prev.map(ri =>
                ri.orderItemId === item.orderItemId
                    ? { ...ri, quantityReturned: qty }
                    : ri
            )
        );
    };

    // Calculate refund
    React.useEffect(() => {
        const total = selectedReturns.reduce(
            (sum, ri) => sum + (ri.priceAtReturn * ri.quantityReturned),
            0
        );
        setRefundAmount(total);
    }, [selectedReturns]);

    const handleSubmit = () => {
        if (selectedReturns.length === 0) {
            alert("Select at least one item to return.");
            return;
        }
        // Reason is now optional, so no check here
        onProcessReturn(order.id, selectedReturns, reason, refundAmount);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
                <div className="modal-header">
                    <h3 className="modal-title">Return Items for Order #{order.id.slice(0, 8)}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-content">
                    <table style={{width: '100%', marginBottom: '10px'}}>
                        <thead>
                            <tr>
                                <th>Return?</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Max Returnable</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map(item => {
                                const maxReturnable = getMaxReturnable(item);
                                const selected = selectedReturns.find(ri => ri.orderItemId === item.orderItemId);
                                return (
                                    <tr key={item.orderItemId}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={!!selected}
                                                disabled={maxReturnable <= 0}
                                                onChange={e => handleSelect(item, e.target.checked)}
                                            />
                                        </td>
                                        <td>{item.displayName}</td>
                                        <td>
                                            {selected ? (
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={maxReturnable}
                                                    value={selected.quantityReturned}
                                                    onChange={e => handleQtyChange(item, Math.max(1, Math.min(maxReturnable, parseInt(e.target.value) || 1)))}
                                                    style={{width: '50px'}}
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>${item.itemPriceWithModifiers.toFixed(2)}</td>
                                        <td>{maxReturnable}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="form-group">
                        <label>Reason for Return (optional):</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="form-input"
                            placeholder="(Optional)"
                        />
                    </div>
                    <div style={{marginTop: '10px', fontWeight: 'bold'}}>
                        Refund Amount: ${refundAmount.toFixed(2)}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleSubmit}>Process Return</button>
                </div>
            </div>
        </div>
    );
}
// ...existing code...
function App() {
    console.log("App function entered - Multi-Order Table Version with Suspend/Resume & Settings");
    const [activeTab, setActiveTab] = useState('pos');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [orderItems, setOrderItems] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderHistory, setOrderHistory] = useLocalStorage('posOrderHistory_v_multiOrder_1', []);
    const [customers, setCustomers] = useLocalStorage('posCustomers_v_multiOrder_1', []);
    const [tables, setTables] = useLocalStorage('posTables_v_multiOrder_1', []);
    const [products, setProducts] = useLocalStorage('posProducts_v_multiOrder_1', initialProductsData);
    const [kitchenOrders, setKitchenOrders] = useLocalStorage('posKitchenOrders_v_multiOrder_1', []);
    const [supportTickets, setSupportTickets] = useLocalStorage('posSupportTickets_v_multiOrder_1', []);
    const [expenses, setExpenses] = useLocalStorage('posExpenses_v1', initialExpenses);
    const [discount, setDiscount] = useState({ type: 'none', value: 0 });
    const [emailJsReady, setEmailJsReady] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [productForOptions, setProductForOptions] = useState(null);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [showTableActionsModal, setShowTableActionsModal] = useState(false);
    const [tableForActions, setTableForActions] = useState(null);

    const [customerPhoneSearchInput, setCustomerPhoneSearchInput] = useState('');
    const [customerSearchMessage, setCustomerSearchMessage] = useState('');
    const [showAddCustomerButtonPOS, setShowAddCustomerButtonPOS] = useState(false);
    const [linkedCustomerId, setLinkedCustomerId] = useState(null);

    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
    const [loyaltyAmountToPayInput, setLoyaltyAmountToPayInput] = useState('');

    const [paymentSplits, setPaymentSplits] = useState([]);
    const [receiptDataForDisplay, setReceiptDataForDisplay] = useState(null);

    const [settings, setSettings] = useLocalStorage('posSettings_v1', initialSettings);
    const [showAdminPinModal, setShowAdminPinModal] = useState(false);
    const [enteredAdminPin, setEnteredAdminPin] = useState('');
    const [adminAccessGranted, setAdminAccessGranted] = useState(!settings.adminPin);
    const [targetAdminTab, setTargetAdminTab] = useState('');

    const [showClearOrderConfirmModal, setShowClearOrderConfirmModal] = useState(false);
    const [currentOrderNotes, setCurrentOrderNotes] = useState('');

    const [showReturnItemsModal, setShowReturnItemsModal] = useState(false);
    const [orderForReturn, setOrderForReturn] = useState(null);
    const [showAddCustomerModalPOS, setShowAddCustomerModalPOS] = useState(false);


    useEffect(() => {
        console.log("App useEffect for EmailJS init running.");
        if (typeof emailjs !== 'undefined' && EMAILJS_USER_ID && EMAILJS_USER_ID !== 'YOUR_USER_ID_PUBLIC_KEY') {
            try {
                emailjs.init(EMAILJS_USER_ID); setEmailJsReady(true); console.log("EmailJS Initialized.");
            } catch (e) { console.error("Failed to initialize EmailJS: ", e); setEmailJsReady(false); }
        } else {
            if (EMAILJS_USER_ID === 'YOUR_USER_ID_PUBLIC_KEY') console.warn("EmailJS User ID is a placeholder. Please update it in POS Main.js.");
            else if (typeof emailjs === 'undefined') console.warn("EmailJS SDK not loaded. Check script tag in index.html.");
            setEmailJsReady(false);
        }
    }, []);

    useEffect(() => {
        setAdminAccessGranted(!settings.adminPin);
    }, [settings.adminPin]);


    const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category.trim()).filter(c => c))].sort(), [products]);
    const filteredProducts = useMemo(() => products.filter(product => (activeCategory === 'All' || product.category === activeCategory) && product.name.toLowerCase().includes(searchTerm.toLowerCase()) && !product.isArchived), [products, activeCategory, searchTerm]);

    const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.itemPriceWithModifiers * item.quantity), 0), [orderItems]);
    const discountAmount = useMemo(() => {
        if (discount.type === 'percentage') return subtotal * ((parseFloat(discount.value) || 0) / 100);
        if (discount.type === 'fixed') return Math.min(parseFloat(discount.value) || 0, subtotal);
        return 0;
    }, [subtotal, discount]);
    const totalAfterDiscount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
    const tax = useMemo(() => totalAfterDiscount * (settings.taxRate || 0), [totalAfterDiscount, settings.taxRate]);

    const currentServiceChargeRate = useMemo(() => {
        const currentOrder = orderHistory.find(o => o.id === selectedOrderId);
        const isTableOrder = selectedTableId || (currentOrder && currentOrder.tableId);
        return isTableOrder ? (settings.serviceChargeRate || 0) : 0;
    }, [selectedTableId, selectedOrderId, orderHistory, settings.serviceChargeRate]);

    const serviceChargeAmount = useMemo(() => {
        return totalAfterDiscount * currentServiceChargeRate;
    }, [totalAfterDiscount, currentServiceChargeRate]);

    const total = useMemo(() => totalAfterDiscount + tax + serviceChargeAmount, [totalAfterDiscount, tax, serviceChargeAmount]);


    const actualLoyaltyAmountPaid = useMemo(() => {
        if (!useLoyaltyPoints || !linkedCustomerId) return 0;
        const customer = customers.find(c => c.id === linkedCustomerId);
        if (!customer || !customer.loyaltyPoints) return 0;
        const maxRedeemableValue = customer.loyaltyPoints * LOYALTY_POINT_VALUE;
        const requestedLoyaltyPayment = parseFloat(loyaltyAmountToPayInput) || 0;
        return Math.min(total, requestedLoyaltyPayment, maxRedeemableValue);
    }, [useLoyaltyPoints, loyaltyAmountToPayInput, total, linkedCustomerId, customers]);

    const pointsNeededForPayment = useMemo(() => {
        return Math.ceil(actualLoyaltyAmountPaid / LOYALTY_POINT_VALUE);
    }, [actualLoyaltyAmountPaid]);

    const totalAmountToCoverBySplits = useMemo(() => {
        return total - actualLoyaltyAmountPaid;
    }, [total, actualLoyaltyAmountPaid]);

    const totalPaidBySplits = useMemo(() => {
        return paymentSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
    }, [paymentSplits]);

    const overallRemainingDue = useMemo(() => {
        const effectivePaidBySplits = Math.min(totalPaidBySplits, totalAmountToCoverBySplits);
        return totalAmountToCoverBySplits - effectivePaidBySplits;
    }, [totalAmountToCoverBySplits, totalPaidBySplits]);

    const overallChangeDue = useMemo(() => {
        let totalCashTendered = 0;
        let totalCashAmountDueInSplits = 0;
        paymentSplits.forEach(split => {
            if (split.method === 'cash') {
                totalCashTendered += parseFloat(split.tendered) || 0;
                totalCashAmountDueInSplits += parseFloat(split.amount) || 0;
            }
        });
        if (totalCashTendered >= totalCashAmountDueInSplits) {
            return totalCashTendered - totalCashAmountDueInSplits;
        }
        return 0;
    }, [paymentSplits]);


    const handleProductClick = (product) => {
        if (selectedOrderId) {
            const currentOrderInHistory = orderHistory.find(o => o.id === selectedOrderId);
            if (currentOrderInHistory && currentOrderInHistory.status === 'Suspended') {
                alert(`Order "${currentOrderInHistory.linkedActiveOrderLabel || selectedOrderId.slice(0,6)}" is suspended. Resume it to add items.`);
                return;
            }
            if (currentOrderInHistory && (currentOrderInHistory.status === 'Paid' || currentOrderInHistory.status === 'BillRequestedTableOrder' || currentOrderInHistory.status === 'Delivered')) {
                alert(`Order ${currentOrderInHistory.linkedActiveOrderLabel || selectedOrderId.slice(0,6)} is already ${currentOrderInHistory.status.toLowerCase().replace('tableorder', '')}. Reopen it from table actions or history to add items.`);
                return;
            }
        } else if (selectedTableId && !selectedOrderId) {
             alert("Please select or start a specific order for this table first from the 'Tables' view or the table actions modal.");
            return;
        }
        if (product.isArchived) { alert(`${product.name} is archived and cannot be added.`); return; }
        if (product.isTemporarilyUnavailable) { alert(`${product.name} is temporarily unavailable.`); return; }
        let effectiveStock = product.productType === 'bundle' ? calculateBundleAvailability(product, products) : product.stock;
        if (effectiveStock <= 0) { alert(`${product.name} is out of stock.`); return; }
        const hasOptions = (product.variationGroups?.length > 0 && product.variationGroups.some(vg => vg.options?.length > 0)) || (product.modifierGroups?.length > 0 && product.modifierGroups.some(mg => mg.options?.length > 0));
        if (hasOptions && product.productType === 'standard') { setProductForOptions(product); setShowOptionsModal(true); }
        else addConfiguredItemToOrder(product, []);
    };

    const addConfiguredItemToOrder = (product, selectedOptionsArray) => {
        let currentPrice = product.price; let displayName = product.name; const optionsSummaryParts = []; let componentDetailsForDisplay = [];
        if (product.productType === 'bundle') {
            displayName = `${product.name} (Bundle)`; let bundleOptionPriceAdjustment = 0;
            (product.bundleItems || []).forEach(bi => {
                const componentProd = products.find(p => p.id === bi.productId);
                if (componentProd) {
                    let componentDisplayNamePart = componentProd.name; let componentOptionSummary = [];
                    (bi.preSelectedOptions || []).forEach(preSelOpt => {
                        const group = (componentProd.variationGroups || []).find(vg => vg.id === preSelOpt.groupId) || (componentProd.modifierGroups || []).find(mg => mg.id === preSelOpt.groupId);
                        if (group) { const option = group.options.find(opt => opt.id === preSelOpt.optionId); if (option) { componentOptionSummary.push(option.name); bundleOptionPriceAdjustment += (option.priceChange || 0); }}
                    });
                    if(componentOptionSummary.length > 0) componentDisplayNamePart += ` (${componentOptionSummary.join(', ')})`;
                    componentDetailsForDisplay.push(`${bi.quantity}x ${componentDisplayNamePart}`);
                }
            });
            currentPrice += bundleOptionPriceAdjustment;
        } else {
            selectedOptionsArray.forEach(selOpt => { currentPrice += selOpt.priceChange; optionsSummaryParts.push(selOpt.optionName); });
            if(optionsSummaryParts.length > 0) displayName += ` (${optionsSummaryParts.join(', ')})`;
        }
        const existingItemIndex = orderItems.findIndex(item => item.productId === product.id && (product.productType === 'bundle' || JSON.stringify(item.selectedOptions.map(o=>o.optionId).sort()) === JSON.stringify(selectedOptionsArray.map(o=>o.optionId).sort())));
        if (existingItemIndex > -1) {
            const updatedOrderItems = [...orderItems]; const itemToUpdate = updatedOrderItems[existingItemIndex];
            let stockToCheck = product.productType === 'standard' ? products.find(p => p.id === product.id)?.stock : calculateBundleAvailability(product, products);
            if (itemToUpdate.quantity + 1 > stockToCheck) { alert(`Not enough stock for ${displayName}. Max: ${stockToCheck}.`); return; }
            updatedOrderItems[existingItemIndex] = { ...itemToUpdate, quantity: itemToUpdate.quantity + 1 };
            setOrderItems(updatedOrderItems);
        } else {
            let stockToCheck = product.productType === 'standard' ? product.stock : calculateBundleAvailability(product, products);
            if (1 > stockToCheck) { alert(`Not enough stock for ${displayName}.`); return; }
            const newOrderItem = {
                orderItemId: generateId(), productId: product.id, name: product.name, basePrice: product.price, quantity: 1,
                selectedOptions: product.productType === 'standard' ? selectedOptionsArray.map(so => ({ groupName: so.groupName, optionName: so.optionName, priceChange: so.priceChange, groupId: so.groupId, optionId: so.optionId })) : [],
                itemPriceWithModifiers: currentPrice, displayName: displayName, image: product.image, category: product.category, productType: product.productType,
                bundleItems: product.bundleItems || [], bundleComponentDetails: product.productType === 'bundle' ? componentDetailsForDisplay : []
            };
            setOrderItems(prevItems => [...prevItems, newOrderItem]);
        }
        setShowOptionsModal(false); setProductForOptions(null);
    };

    const removeFromOrder = useCallback((orderItemId) => setOrderItems(prevItems => prevItems.filter(item => item.orderItemId !== orderItemId)), []);

    const updateQuantity = useCallback((orderItemId, newQuantityOrMultiplier) => {
        setOrderItems(prevItems => prevItems.map(item => {
            if (item.orderItemId === orderItemId) {
                let newQuantity;
                if (typeof newQuantityOrMultiplier === 'string' && newQuantityOrMultiplier.startsWith('x')) {
                    const multiplier = parseInt(newQuantityOrMultiplier.substring(1), 10);
                    newQuantity = item.quantity * multiplier;
                } else {
                    newQuantity = parseInt(newQuantityOrMultiplier, 10);
                }

                if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;

                const productDetails = products.find(p => p.id === item.productId);
                if (!productDetails) return item;

                let stockToCheck = productDetails.productType === 'standard' ? productDetails.stock : calculateBundleAvailability(productDetails, products);
                if (newQuantity > stockToCheck) {
                    alert(`Only ${stockToCheck} ${item.name} available. Setting to max.`);
                    newQuantity = stockToCheck;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    }, [products]);


    const updateInventory = useCallback((itemsToUpdate, operation = 'subtract') => {
        setProducts(prevProducts => {
            const newProducts = JSON.parse(JSON.stringify(prevProducts));
            itemsToUpdate.forEach(orderItem => {
                const quantityToChange = operation === 'subtract' ? (orderItem.quantity || orderItem.quantityReturned) : -(orderItem.quantity || orderItem.quantityReturned);

                if (orderItem.productType === 'standard') {
                    const productIndex = newProducts.findIndex(p => p.id === orderItem.productId);
                    if (productIndex > -1) {
                        newProducts[productIndex].stock = Math.max(0, newProducts[productIndex].stock - quantityToChange);
                    }
                } else if (orderItem.productType === 'bundle') {
                    (orderItem.bundleItems || []).forEach(bundleComponent => {
                        const componentIndex = newProducts.findIndex(p => p.id === bundleComponent.productId);
                        if (componentIndex > -1) {
                            newProducts[componentIndex].stock = Math.max(0, newProducts[componentIndex].stock - (bundleComponent.quantity * quantityToChange));
                        }
                    });
                }
            });
            return newProducts;
        });
    }, [setProducts]);

    const sendToKitchen = useCallback((itemsForKDS, mainDistinctOrderId, customerLabelForKDS, orderNotesForKDS) => {
        if (itemsForKDS.length > 0 || (orderNotesForKDS && orderNotesForKDS.trim() !== '')) {
            const newKitchenOrder = {
                id: generateId(), mainOrderId: mainDistinctOrderId,
                items: itemsForKDS,
                customer: customerLabelForKDS || 'Walk-in',
                timestamp: new Date().toISOString(), status: 'Pending',
                notes: orderNotesForKDS || ''
            };
            setKitchenOrders(prev => [newKitchenOrder, ...prev]);
            console.log("Sent to KDS:", newKitchenOrder);
        }
    }, [setKitchenOrders]);

    const processPayment = () => {
        if (useLoyaltyPoints) {
            if (!linkedCustomerId) {
                alert("Please select a customer to use loyalty points."); return;
            }
            const customer = customers.find(c => c.id === linkedCustomerId);
            if (!customer) {
                alert("Customer not found for loyalty payment."); return;
            }
            if (pointsNeededForPayment > (customer.loyaltyPoints || 0)) {
                alert(`Not enough loyalty points. Available: ${customer.loyaltyPoints || 0}, Needed: ${pointsNeededForPayment}`);
                return;
            }
            if (actualLoyaltyAmountPaid <= 0 && loyaltyAmountToPayInput > 0) {
                alert("Invalid amount entered for loyalty points payment."); return;
            }
        }

        let sumOfSplitAmounts = 0;
        for (const split of paymentSplits) {
            const splitAmount = parseFloat(split.amount) || 0;
            if (splitAmount <= 0 && paymentSplits.length > 1 && totalAmountToCoverBySplits > 0.001) {
                 alert(`Invalid amount $${splitAmount.toFixed(2)} for ${split.method} payment. Amount must be positive if covering a remaining balance.`); return;
            }
            if (split.method === 'cash') {
                const tendered = parseFloat(split.tendered) || 0;
                if (tendered < splitAmount) {
                    alert(`Cash tendered ($${tendered.toFixed(2)}) for one of the cash payments is less than the amount due ($${splitAmount.toFixed(2)}).`);
                    return;
                }
            }
            sumOfSplitAmounts += splitAmount;
        }

        if (Math.abs(sumOfSplitAmounts - totalAmountToCoverBySplits) > 0.001 && totalAmountToCoverBySplits > 0) {
             alert(`The sum of payment splits ($${sumOfSplitAmounts.toFixed(2)}) does not match the remaining amount due after loyalty ($${totalAmountToCoverBySplits.toFixed(2)}). Please adjust amounts.`);
             return;
        }
        if (totalAmountToCoverBySplits <= 0 && paymentSplits.some(s => (parseFloat(s.amount) || 0) > 0)) {
            alert("No amount remaining to be paid by other methods. Please remove or adjust other payment splits.");
            return;
        }


        const currentPaymentMethodsUsed = [];
        if (useLoyaltyPoints && actualLoyaltyAmountPaid > 0) {
            currentPaymentMethodsUsed.push({
                method: 'loyalty',
                amount: actualLoyaltyAmountPaid,
                points: pointsNeededForPayment
            });
        }
        paymentSplits.forEach(split => {
            const splitAmountNum = parseFloat(split.amount) || 0;
            if (splitAmountNum > 0) {
                let paymentDetail = { method: split.method, amount: splitAmountNum };
                if (split.method === 'cash') {
                    paymentDetail.received = parseFloat(split.tendered) || 0;
                    paymentDetail.change = Math.max(0, paymentDetail.received - splitAmountNum);
                }
                currentPaymentMethodsUsed.push(paymentDetail);
            }
        });

        if (useLoyaltyPoints && actualLoyaltyAmountPaid >= total && paymentSplits.every(s => (parseFloat(s.amount) || 0) === 0)) {
        } else if (currentPaymentMethodsUsed.length === 0 && total > 0) {
            alert("Please add a payment method to cover the bill.");
            return;
        }

        const currentOrderForReceipt = orderHistory.find(o => o.id === selectedOrderId);
        const isTableOrderForReceipt = selectedTableId || (currentOrderForReceipt && currentOrderForReceipt.tableId);
        const actualServiceChargeForReceipt = isTableOrderForReceipt ? serviceChargeAmount : 0;
        const actualTotalForReceipt = totalAfterDiscount + tax + actualServiceChargeForReceipt;


        setReceiptDataForDisplay({
            orderId: selectedOrderId || 'NEW',
            customerName: customerName || (linkedCustomerId ? customers.find(c=>c.id===linkedCustomerId)?.name : 'Walk-in'),
            items: [...orderItems],
            subtotal,
            discountAmount,
            tax,
            serviceCharge: actualServiceChargeForReceipt,
            total: actualTotalForReceipt,
            paymentMethodsUsed: currentPaymentMethodsUsed,
            date: new Date().toISOString(),
            notes: currentOrderNotes,
            cafeName: settings.cafeName,
            cafeAddress: settings.cafeAddress,
            cafePhone: settings.cafePhone,
            cafeWebsite: settings.cafeWebsite,
            cafeLogoUrl: settings.cafeLogoUrl,
            receiptHeaderMsg: settings.receiptHeaderMsg,
            receiptFooterMsg: settings.receiptFooterMsg,
            showReceiptLogo: settings.showReceiptLogo,
        });
        setShowReceipt(true);
    };


    const handleUpdateAndPayTableOrder = () => {
        if (!selectedOrderId || !selectedTableId) {
            alert("This action is for existing table orders. Please select a table and an order."); return;
        }
        if (orderItems.length === 0) {
            alert("Add items to the order first."); return;
        }
        const existingOrderIndex = orderHistory.findIndex(o => o.id === selectedOrderId);
        if (existingOrderIndex === -1) {
            alert("Error: Could not find the table order to update."); return;
        }
        const originalOrder = orderHistory[existingOrderIndex];
        const itemsForKDS = [];
        orderItems.forEach(currentItem => {
            const originalItem = originalOrder.items.find(oi => oi.orderItemId === currentItem.orderItemId);
            if (!originalItem) {
                itemsForKDS.push({ name: currentItem.displayName, quantity: currentItem.quantity, id: currentItem.productId, options: currentItem.selectedOptions ? currentItem.selectedOptions.map(o => `${o.groupName}: ${o.optionName}`).join(', ') : '' });
            } else if (currentItem.quantity > originalItem.quantity) {
                itemsForKDS.push({ name: currentItem.displayName, quantity: currentItem.quantity - originalItem.quantity, id: currentItem.productId, options: currentItem.selectedOptions ? currentItem.selectedOptions.map(o => `${o.groupName}: ${o.optionName}`).join(', ') : '' });
            }
        });
        if (itemsForKDS.length > 0 || currentOrderNotes !== (originalOrder.notes || '')) {
            sendToKitchen(itemsForKDS, selectedOrderId, customerName || originalOrder.linkedActiveOrderLabel, currentOrderNotes);
        }
        const updatedOrderData = {
            ...originalOrder,
            items: JSON.parse(JSON.stringify(orderItems)),
            subtotal, tax, discount: discountAmount, serviceCharge: serviceChargeAmount, total,
            customer: customerName || originalOrder.customer,
            customerId: linkedCustomerId || originalOrder.customerId,
            appliedDiscountInfo: JSON.parse(JSON.stringify(discount)),
            linkedActiveOrderLabel: customerName || originalOrder.linkedActiveOrderLabel,
            notes: currentOrderNotes,
            lastUpdatedAt: new Date().toISOString(),
        };
        const newOrderHistory = [...orderHistory];
        newOrderHistory[existingOrderIndex] = updatedOrderData;
        setOrderHistory(newOrderHistory);
        setTables(prevTables => prevTables.map(t => {
            if (t.id === selectedTableId) {
                return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === selectedOrderId ? { ...ao, total: total, displayLabel: updatedOrderData.linkedActiveOrderLabel } : ao)};
            }
            return t;
        }));
        alert(`Table order "${updatedOrderData.linkedActiveOrderLabel}" updated. Proceeding to payment.`);
        setPaymentSplits([{ id: generateId(), method: 'cash', amount: total.toFixed(2), tendered: total.toFixed(2) }]);
        setUseLoyaltyPoints(false);
        setLoyaltyAmountToPayInput('');
        setShowPaymentModal(true);
    };

    const handleCheckoutToGoOrder = () => {
        if (selectedTableId) {
            alert("This checkout is for To-Go orders only. For table orders, use 'Update Table Order & Pay'.");
            return;
        }
        const isResumedActiveWalkin = selectedOrderId && orderHistory.find(o => o.id === selectedOrderId)?.status === 'ActiveWalkinResumed';
        const isNewWalkin = !selectedOrderId;
        if (!isNewWalkin && !isResumedActiveWalkin) {
            alert("Order is not a valid To-Go order for checkout. Please check its status or resume if suspended.");
            return;
        }
        if (orderItems.length === 0) {
            alert("Add items to the To-Go order first.");
            return;
        }
        setPaymentSplits([{ id: generateId(), method: 'cash', amount: total.toFixed(2), tendered: total.toFixed(2) }]);
        setUseLoyaltyPoints(false);
        setLoyaltyAmountToPayInput('');
        setShowPaymentModal(true);
    };

    const handleSuspendOrder = useCallback(() => {
        if (orderItems.length === 0 && !selectedOrderId) {
            alert("Add items to the order before suspending."); return;
        }
        const orderDataToSuspend = {
            items: JSON.parse(JSON.stringify(orderItems)),
            customer: customerName || (selectedOrderId ? orderHistory.find(o=>o.id === selectedOrderId)?.customer : 'Walk-in'),
            customerId: linkedCustomerId || (selectedOrderId ? orderHistory.find(o=>o.id === selectedOrderId)?.customerId : null),
            subtotal: subtotal, tax: tax, serviceCharge: serviceChargeAmount, discount: discountAmount, total: total,
            appliedDiscountInfo: JSON.parse(JSON.stringify(discount)),
            notes: currentOrderNotes,
            status: 'Suspended', lastUpdatedAt: new Date().toISOString(),
            paymentMethodsUsed: [], paidWithLoyaltyAmount: 0, loyaltyPointsRedeemed: 0,
        };
        if (selectedOrderId) {
            const existingOrderIndex = orderHistory.findIndex(o => o.id === selectedOrderId);
            if (existingOrderIndex > -1) {
                const originalOrder = orderHistory[existingOrderIndex];
                const updatedOrder = {
                    ...originalOrder, ...orderDataToSuspend,
                    linkedActiveOrderLabel: customerName || originalOrder.linkedActiveOrderLabel,
                };
                const newOrderHistory = [...orderHistory];
                newOrderHistory[existingOrderIndex] = updatedOrder;
                setOrderHistory(newOrderHistory);
                if (updatedOrder.tableId) {
                    setTables(prevTables => prevTables.map(t => {
                        if (t.id === updatedOrder.tableId) {
                            return {
                                ...t, activeOrders: t.activeOrders.map(ao =>
                                    ao.orderId === selectedOrderId ? { ...ao, status: 'suspended', total: updatedOrder.total, displayLabel: updatedOrder.linkedActiveOrderLabel } : ao
                                )};
                        } return t;
                    }));
                }
                alert(`Order "${updatedOrder.linkedActiveOrderLabel}" suspended.`);
            } else {
                alert("Error: Could not find the order to suspend."); return;
            }
        } else {
            const newSuspendedOrderId = generateId();
            const newSuspendedOrder = {
                id: newSuspendedOrderId, date: new Date().toISOString(),
                ...orderDataToSuspend, tableId: null,
                linkedActiveOrderLabel: customerName || `Suspended ${newSuspendedOrderId.slice(0,4)}`,
            };
            setOrderHistory(prev => [newSuspendedOrder, ...prev]);
            alert(`New walk-in order "${newSuspendedOrder.linkedActiveOrderLabel}" suspended.`);
        }
        clearPOSPanel(true);
    }, [orderItems, customerName, discount, subtotal, tax, serviceChargeAmount, discountAmount, total, selectedOrderId, orderHistory, customers, tables, setOrderHistory, setTables, clearPOSPanel, linkedCustomerId, currentOrderNotes]);

    const handleResumeOrder = useCallback((orderIdToResume) => {
        const orderToResume = orderHistory.find(o => o.id === orderIdToResume && o.status === 'Suspended');
        if (!orderToResume) {
            alert("Could not find or resume the selected order. It might not be suspended or may no longer exist."); return;
        }
        setOrderItems(JSON.parse(JSON.stringify(orderToResume.items)));
        setCustomerName(orderToResume.customer || orderToResume.linkedActiveOrderLabel);
        setDiscount(JSON.parse(JSON.stringify(orderToResume.appliedDiscountInfo || { type: 'none', value: 0 })));
        setCurrentOrderNotes(orderToResume.notes || '');
        setSelectedOrderId(orderIdToResume);
        setSelectedTableId(orderToResume.tableId);
        setLinkedCustomerId(orderToResume.customerId);
        const newStatus = orderToResume.tableId ? 'ActiveTableOrder' : 'ActiveWalkinResumed';
        setOrderHistory(prevOH => prevOH.map(o => o.id === orderIdToResume ? { ...o, status: newStatus, lastUpdatedAt: new Date().toISOString() } : o));
        if (orderToResume.tableId) {
            setTables(prevTables => prevTables.map(t => {
                if (t.id === orderToResume.tableId) {
                    return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === orderIdToResume ? { ...ao, status: 'active' } : ao )};
                } return t;
            }));
        }
        setActiveTab('pos');
        setCustomerSearchMessage(orderToResume.customerId ? `Customer: ${customers.find(c=>c.id === orderToResume.customerId)?.name || orderToResume.customer}` : '');
        setShowAddCustomerButtonPOS(false);
        setCustomerPhoneSearchInput(customers.find(c=>c.id === orderToResume.customerId)?.phone || '');
        setPaymentSplits([{ id: generateId(), method: 'cash', amount: orderToResume.total.toFixed(2), tendered: orderToResume.total.toFixed(2) }]);
        setUseLoyaltyPoints(false);
        setLoyaltyAmountToPayInput('');
        alert(`Order "${orderToResume.linkedActiveOrderLabel}" resumed.`);
    }, [orderHistory, setOrderHistory, setTables, setActiveTab, customers]);

    const completeOrder = useCallback(() => {
        if (!receiptDataForDisplay) {
            console.error("No receipt data to complete order.");
            alert("Error completing order. Please try again.");
            return;
        }
        let orderToSave;
        const {
            orderId: tempOrderId, items: receiptItems, subtotal: receiptSubtotal,
            discountAmount: receiptDiscountAmount, tax: receiptTax, serviceCharge: receiptServiceChargeToDisplay,
            total: receiptTotalToDisplay, customerName: receiptCustomerName,
            paymentMethodsUsed: receiptPaymentMethodsUsed, notes: receiptNotes
        } = receiptDataForDisplay;

        const originalOrderContext = orderHistory.find(o => o.id === tempOrderId);
        const isTableOrderForSaving = selectedTableId || (originalOrderContext && originalOrderContext.tableId);
        const actualServiceChargeForSaving = isTableOrderForSaving ? (settings.serviceChargeRate * (receiptSubtotal - receiptDiscountAmount)) : 0;
        const actualTotalForSaving = (receiptSubtotal - receiptDiscountAmount) + receiptTax + actualServiceChargeForSaving;


        const finalCustomerId = linkedCustomerId;
        const finalCustomerName = receiptCustomerName;
        const finalPaidWithLoyalty = receiptPaymentMethodsUsed.find(pm => pm.method === 'loyalty')?.amount || 0;
        const finalPointsRedeemed = receiptPaymentMethodsUsed.find(pm => pm.method === 'loyalty')?.points || 0;

        let isWalkinOrderBeingFinalized = !selectedTableId && (tempOrderId === 'NEW' || orderHistory.find(o=>o.id===tempOrderId)?.status === 'ActiveWalkinResumed') && receiptItems.length > 0;

        if (tempOrderId !== 'NEW' && !isWalkinOrderBeingFinalized) {
            const existingOrderIndex = orderHistory.findIndex(o => o.id === tempOrderId);
            if (existingOrderIndex === -1) { console.error("Error: Order to complete not found:", tempOrderId); return; }
            orderToSave = {
                ...orderHistory[existingOrderIndex],
                items: receiptItems,
                subtotal: receiptSubtotal, tax: receiptTax,
                serviceCharge: actualServiceChargeForSaving,
                discount: receiptDiscountAmount,
                total: actualTotalForSaving,
                paymentMethodsUsed: receiptPaymentMethodsUsed,
                paidWithLoyaltyAmount: finalPaidWithLoyalty,
                loyaltyPointsRedeemed: finalPointsRedeemed,
                appliedDiscountInfo: JSON.parse(JSON.stringify(discount)),
                customer: finalCustomerName,
                customerId: finalCustomerId,
                notes: receiptNotes,
                status: 'Paid', paidAt: new Date().toISOString(),
                type: 'sale',
            };
            const updatedOrderHistory = [...orderHistory];
            updatedOrderHistory[existingOrderIndex] = orderToSave;
            setOrderHistory(updatedOrderHistory);
        } else if (isWalkinOrderBeingFinalized) {
            const orderIdForWalkin = tempOrderId === 'NEW' ? generateId() : tempOrderId;
            const originalOrderDate = tempOrderId === 'NEW' ? new Date().toISOString() : orderHistory.find(o=>o.id===tempOrderId)?.date;
            orderToSave = {
                id: orderIdForWalkin, date: originalOrderDate,
                items: receiptItems,
                subtotal: receiptSubtotal, tax: receiptTax,
                serviceCharge: actualServiceChargeForSaving,
                discount: receiptDiscountAmount,
                total: actualTotalForSaving,
                customer: finalCustomerName,
                customerId: finalCustomerId,
                paymentMethodsUsed: receiptPaymentMethodsUsed,
                paidWithLoyaltyAmount: finalPaidWithLoyalty,
                loyaltyPointsRedeemed: finalPointsRedeemed,
                notes: receiptNotes,
                status: 'Paid', tableId: null,
                appliedDiscountInfo: JSON.parse(JSON.stringify(discount)),
                linkedActiveOrderLabel: finalCustomerName || `To-Go ${orderIdForWalkin.slice(0,4)}`,
                paidAt: new Date().toISOString(),
                type: 'sale',
            };
            if (tempOrderId !== 'NEW') {
                 const existingIndex = orderHistory.findIndex(o => o.id === tempOrderId);
                 if (existingIndex > -1) {
                    const newHist = [...orderHistory]; newHist[existingIndex] = orderToSave; setOrderHistory(newHist);
                 } else { setOrderHistory(prev => [orderToSave, ...prev]); }
            } else {
                setOrderHistory(prev => [orderToSave, ...prev]);
            }
            const itemsForKDS = receiptItems.map(item => ({ name: item.displayName, quantity: item.quantity, id: item.productId, options: item.selectedOptions ? item.selectedOptions.map(o => `${o.groupName}: ${o.optionName}`).join(', ') : '' }));
            sendToKitchen(itemsForKDS, orderIdForWalkin, orderToSave.linkedActiveOrderLabel, orderToSave.notes);
        } else {
            console.error("CompleteOrder called without a valid order context (from receiptData)."); return;
        }

        if (orderToSave.customerId && finalPointsRedeemed >= 0) {
            let pointsToAward = Math.floor(orderToSave.total);
            setCustomers(prevCustomers => prevCustomers.map(c => {
                if (c.id === orderToSave.customerId) {
                    let newLoyaltyPoints = (parseFloat(c.loyaltyPoints) || 0) - finalPointsRedeemed + pointsToAward;
                    return { ...c, lastVisit: new Date().toISOString(), loyaltyPoints: Math.max(0, newLoyaltyPoints) };
                }
                return c;
            }));
        }

        if (orderToSave.tableId && selectedOrderId) {
            setTables(prevTables => prevTables.map(t => {
                if (t.id === orderToSave.tableId) {
                    const updatedActiveOrders = t.activeOrders.filter(ao => ao.orderId !== selectedOrderId);
                    return { ...t, activeOrders: updatedActiveOrders, status: updatedActiveOrders.length > 0 ? 'occupied' : 'needs_cleaning' };
                } return t;
            }));
        }
        updateInventory(receiptItems);
        clearPOSPanel();
        setShowPaymentModal(false); setShowReceipt(false);
        setReceiptDataForDisplay(null);
    }, [receiptDataForDisplay, discount, orderHistory, customers, tables, updateInventory, sendToKitchen, setOrderHistory, setCustomers, setTables, clearPOSPanel, linkedCustomerId, useLoyaltyPoints, actualLoyaltyAmountPaid, pointsNeededForPayment, paymentSplits, selectedTableId, selectedOrderId, settings.serviceChargeRate, currentOrderNotes, totalAfterDiscount, tax]);


    const markOrderComplete = useCallback((kitchenOrderId) => {
        let mainDistinctOrderIdToUpdate = null;
        setKitchenOrders(prevOrders => prevOrders.map(order => {
            if (order.id === kitchenOrderId) { mainDistinctOrderIdToUpdate = order.mainOrderId; return { ...order, status: 'Completed' }; }
            return order;
        }));
        if (mainDistinctOrderIdToUpdate) {
            setOrderHistory(prevOH => prevOH.map(o => {
                if (o.id === mainDistinctOrderIdToUpdate && o.status !== 'Paid' && o.status !== 'Delivered' && o.status !== 'Suspended') {
                    return { ...o, status: 'ReadyForDeliveryPickup' };
                }
                return o;
            }));
        }
    }, [setKitchenOrders, setOrderHistory]);

    const markOrderAsDelivered = useCallback((distinctOrderId) => {
        let tableIdToClear = null;
        let orderWasPaidOrReady = false;
        let orderIsSuspended = false;
        setOrderHistory(prevOrderHistory => prevOrderHistory.map(order => {
            if (order.id === distinctOrderId) {
                if (order.status === 'Suspended') {
                    alert("Cannot mark a suspended order as delivered. Please resume it first.");
                    orderIsSuspended = true;
                    return order;
                }
                tableIdToClear = order.tableId;
                orderWasPaidOrReady = order.status === 'Paid' || order.status === 'ReadyForDeliveryPickup';
                return { ...order, status: 'Delivered' };
            }
            return order;
        }));
        if (orderIsSuspended) return;
        if (tableIdToClear && orderWasPaidOrReady) {
            setTables(prevTables => prevTables.map(t => {
                if (t.id === tableIdToClear) {
                    const otherActiveOrders = t.activeOrders.filter(ao => ao.orderId !== distinctOrderId);
                    if (otherActiveOrders.length === 0) {
                        return { ...t, status: 'needs_cleaning', activeOrders: [] };
                    }
                     return { ...t, activeOrders: t.activeOrders.filter(ao => ao.orderId !== distinctOrderId) };
                }
                return t;
            }));
        }
    }, [setOrderHistory, setTables, orderHistory]);

    const printReceipt = () => window.print();
    const handleModalClose = () => {
        setShowPaymentModal(false);
        if (showReceipt) setShowReceipt(false);
        setUseLoyaltyPoints(false);
        setLoyaltyAmountToPayInput('');
        setPaymentSplits([]);
        setReceiptDataForDisplay(null);
    };
    const handleOptionsModalClose = () => { setShowOptionsModal(false); setProductForOptions(null); };

    const getReceiptOrderId = useCallback(() => {
        if (receiptDataForDisplay && receiptDataForDisplay.orderId && receiptDataForDisplay.orderId !== 'NEW') {
            return receiptDataForDisplay.orderId.slice(0,8);
        }
        if (selectedOrderId) return selectedOrderId.slice(0,8);
        const justPaidOrder = orderHistory.find(o => o.status === 'Paid' && JSON.stringify(o.items) === JSON.stringify(orderItems));
        if (justPaidOrder) return justPaidOrder.id.slice(0,8);
        return 'N/A';
    }, [selectedOrderId, orderHistory, orderItems, receiptDataForDisplay]);


    const addProductHandler = (newProductData) => { const newP = { ...newProductData, id: generateId(), variationGroups: newProductData.variationGroups || [], modifierGroups: newProductData.modifierGroups || [], isArchived: newProductData.isArchived || false }; setProducts(prev => [...prev, newP]); alert(`${newP.name} added!`); };
    const updateProductHandler = (id, updatedData) => { setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData, variationGroups: updatedData.variationGroups || p.variationGroups || [], modifierGroups: updatedData.modifierGroups || p.modifierGroups || [], isArchived: typeof updatedData.isArchived === 'boolean' ? updatedData.isArchived : p.isArchived } : p)); alert(`${updatedData.name} updated!`); };
    const archiveProductHandler = (id) => setProducts(prev => prev.map(p => p.id === id ? {...p, isArchived: true} : p));
    const unarchiveProductHandler = (id) => setProducts(prev => prev.map(p => p.id === id ? {...p, isArchived: false} : p));
    const removeProductHandler = (id) => { if (window.confirm("PERMANENTLY DELETE this product? This action cannot be undone.")) setProducts(prev => prev.filter(p => p.id !== id)); };
    const handleRenameCategory = useCallback((oldName, newName) => {
        if (!oldName || !newName || oldName === newName) { alert("Select category and provide a different new name."); return; }
        if (products.map(p => p.category.toLowerCase()).includes(newName.toLowerCase()) && newName.toLowerCase() !== oldName.toLowerCase()) { alert(`Category "${newName}" already exists.`); return; }
        setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName.trim() } : p)); alert(`Category "${oldName}" renamed to "${newName}".`);
    }, [setProducts, products]);
    const handleExportProducts = () => {
        const header = ["ID", "Name", "Category", "Price", "Stock", "Min Stock", "Image Emoji", "Image URL", "Temporarily Unavailable", "Archived", "Product Type", "Bundle Items (JSON)", "Variation Groups (JSON)", "Modifier Groups (JSON)"];
        const rows = products.map(p => [p.id, `"${(p.name || '').replace(/"/g, '""')}"`, `"${(p.category || '').replace(/"/g, '""')}"`, p.price, p.productType === 'bundle' ? calculateBundleAvailability(p, products) : p.stock, p.productType === 'bundle' ? 'N/A' : p.minStock, p.image, `"${(p.imageUrl || '').replace(/"/g, '""')}"`, p.isTemporarilyUnavailable, p.isArchived, p.productType || 'standard', `"${JSON.stringify(p.bundleItems || []).replace(/"/g, '""')}"`, `"${JSON.stringify(p.variationGroups || []).replace(/"/g, '""')}"`, `"${JSON.stringify(p.modifierGroups || []).replace(/"/g, '""')}"`].join(","));
        const csvString = [header.join(","), ...rows].join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url);
        const date = new Date(); const dateString = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
        link.setAttribute("download", `cafe_products_export_${dateString}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    };
    const handleImportProducts = (file) => {
        if (!file) { alert("No file selected."); return; } if (file.type !== "application/json") { alert("Invalid file type. Please select a JSON file."); return; }
        if (!window.confirm("This will REPLACE all current products with the content of the file. This action cannot be undone. Are you sure?")) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result); if (!Array.isArray(imported)) throw new Error("Not a valid product array in JSON file.");
                const validated = imported.map(p => ({ id: p.id || generateId(), name: p.name || 'Unnamed Product', price: typeof p.price === 'number' ? p.price : 0, category: p.category || 'Uncategorized', image: p.image || '❓', imageUrl: p.imageUrl || '', stock: typeof p.stock === 'number' ? p.stock : 0, minStock: typeof p.minStock === 'number' ? p.minStock : 0, isTemporarilyUnavailable: typeof p.isTemporarilyUnavailable === 'boolean' ? p.isTemporarilyUnavailable : false, isArchived: typeof p.isArchived === 'boolean' ? p.isArchived : false, productType: p.productType || 'standard', bundleItems: Array.isArray(p.bundleItems) ? p.bundleItems.map(bi => ({...bi, preSelectedOptions: bi.preSelectedOptions || []})) : [], variationGroups: Array.isArray(p.variationGroups) ? p.variationGroups : [], modifierGroups: Array.isArray(p.modifierGroups) ? p.modifierGroups : [] }));
                setProducts(validated); alert("Products imported successfully!");
            } catch (err) { alert("Failed to import products. Please ensure the JSON file is correctly formatted. Error: " + err.message); }
        }; reader.readAsText(file);
    };
    const addSupportTicket = (ticketData) => { const newT = { ...ticketData, id: generateId(), timestamp: new Date().toISOString(), status: 'Open' }; setSupportTickets(prev => [newT, ...prev]); };

    const addCustomerHandler = (newData) => {
        const newC = { ...newData, id: generateId(), createdAt: new Date().toISOString(), lastVisit: new Date().toISOString() };
        setCustomers(prev => [...prev, newC]);
        // alert(`Customer ${newC.name} added.`); // Alert moved to the calling function for context
        return newC.id;
    };
    const updateCustomerHandler = (id, updatedData) => { setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedData, lastVisit: updatedData.lastVisit || c.lastVisit } : c)); alert("Customer updated."); };
    const removeCustomerHandler = (id) => { if (window.confirm("Delete this customer? This action cannot be undone.")) setCustomers(prev => prev.filter(c => c.id !== id)); };

    const addTableHandler = (tableData) => { const newTable = { ...tableData, id: generateId(), status: 'available', activeOrders: [] }; setTables(prev => [...prev, newTable]); alert(`Table ${newTable.name} added.`); };
    const updateTableHandler = (tableId, updatedData) => { setTables(prev => prev.map(t => t.id === tableId ? {...t, name: updatedData.name, capacity: updatedData.capacity } : t)); alert(`Table ${updatedData.name || 'details'} updated.`); };
    const removeTableHandler = (tableId) => {
        const tableToRemove = tables.find(t => t.id === tableId);
        if (tableToRemove && tableToRemove.activeOrders && tableToRemove.activeOrders.length > 0) {
            alert(`Cannot delete table ${tableToRemove.name} as it has active orders. Please clear or transfer these orders first.`); return;
        }
        if (window.confirm("Delete this table? This action cannot be undone.")) setTables(prev => prev.filter(t => t.id !== tableId));
    };

    const openTableActions = (tableId) => { const table = tables.find(t => t.id === tableId); if (table) { setTableForActions(table); setShowTableActionsModal(true); }};
    const updateTableGeneralStatusHandler = (tableId, newStatus) => {
        setTables(prevTables => prevTables.map(t => {
            if (t.id === tableId) {
                if (newStatus === 'reserved' && t.activeOrders?.length > 0) { alert("Cannot mark an occupied table as reserved. Clear orders first."); return t; }
                if (newStatus === 'available' && t.activeOrders?.length > 0) { alert("Table has active orders. Cannot mark as available directly. Clear orders first."); return t; }
                return { ...t, status: newStatus };
            } return t;
        }));
        setShowTableActionsModal(false);
    };
    const startNewDistinctOrderHandler = (tableId, orderLabel) => {
        const newOrderId = generateId();
        const actualLabel = orderLabel || `Order ${newOrderId.slice(0,4)}`;
        const newOrderInHistory = {
            id: newOrderId, date: new Date().toISOString(), items: [],
            subtotal: 0, tax: 0, serviceCharge: 0, discount: 0, total: 0,
            appliedDiscountInfo: { type: 'none', value: 0 },
            customer: actualLabel, customerId: linkedCustomerId,
            paymentMethod: '', status: 'ActiveTableOrder', tableId: tableId,
            linkedActiveOrderLabel: actualLabel,
            notes: '',
            paymentMethodsUsed: [], paidWithLoyaltyAmount: 0, loyaltyPointsRedeemed: 0,
            type: 'sale', returnedItems: [],
        };
        setOrderHistory(prev => [newOrderInHistory, ...prev]);
        setTables(prevTables => prevTables.map(t => {
            if (t.id === tableId) {
                const newActiveOrderMeta = { orderId: newOrderId, displayLabel: actualLabel, total: 0, status: 'active' };
                return { ...t, status: 'occupied', activeOrders: [...t.activeOrders, newActiveOrderMeta] };
            } return t;
        }));
        setOrderItems([]); setCustomerName(actualLabel); setDiscount({ type: 'none', value: 0 });
        setCurrentOrderNotes('');
        setSelectedTableId(tableId); setSelectedOrderId(newOrderId);
        setCustomerPhoneSearchInput(''); setCustomerSearchMessage(''); setShowAddCustomerButtonPOS(false);
        setPaymentSplits([{ id: generateId(), method: 'cash', amount: 0, tendered: 0 }]);
        setUseLoyaltyPoints(false); setLoyaltyAmountToPayInput('');
        setActiveTab('pos');
        setShowTableActionsModal(false);
        alert(`Started new order "${actualLabel}" for table ${tables.find(t => t.id === tableId)?.name}. Add items in POS.`);
    };
    const viewDistinctOrderHandler = (tableId, distinctOrderId) => {
        const orderToLoad = orderHistory.find(o => o.id === distinctOrderId && o.tableId === tableId);
        if (orderToLoad) {
            if (orderToLoad.status === 'Suspended') {
                setOrderHistory(prevOH => prevOH.map(o => o.id === distinctOrderId ? { ...o, status: 'ActiveTableOrder', lastUpdatedAt: new Date().toISOString() } : o));
                setTables(prevTables => prevTables.map(t => {
                    if (t.id === tableId) {
                        return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === distinctOrderId ? { ...ao, status: 'active' } : ao) };
                    } return t;
                }));
                 alert(`Order "${orderToLoad.linkedActiveOrderLabel}" resumed on table ${tables.find(t=>t.id === tableId)?.name}.`);
            } else if (orderToLoad.status === 'Paid' || orderToLoad.status === 'Delivered') {
                alert(`Order "${orderToLoad.linkedActiveOrderLabel}" is already ${orderToLoad.status}. Cannot modify directly. View in history.`);
                setShowTableActionsModal(false);
                return;
            }
            setOrderItems(JSON.parse(JSON.stringify(orderToLoad.items)));
            setCustomerName(orderToLoad.linkedActiveOrderLabel || orderToLoad.customer);
            setDiscount(JSON.parse(JSON.stringify(orderToLoad.appliedDiscountInfo || { type: 'none', value: 0 })));
            setCurrentOrderNotes(orderToLoad.notes || '');
            setSelectedTableId(tableId);
            setSelectedOrderId(distinctOrderId);
            setLinkedCustomerId(orderToLoad.customerId);
            setCustomerPhoneSearchInput(customers.find(c=>c.id === orderToLoad.customerId)?.phone || '');
            setCustomerSearchMessage(orderToLoad.customerId ? `Customer: ${customers.find(c=>c.id === orderToLoad.customerId)?.name || orderToLoad.customer}` : '');
            setShowAddCustomerButtonPOS(false);
            setPaymentSplits([{ id: generateId(), method: 'cash', amount: orderToLoad.total.toFixed(2), tendered: orderToLoad.total.toFixed(2) }]);
            setUseLoyaltyPoints(false); setLoyaltyAmountToPayInput('');
            setActiveTab('pos');
            setShowTableActionsModal(false);
        } else alert("Could not load the selected order from history.");
    };
    const requestBillForDistinctOrderHandler = (tableId, distinctOrderId) => {
        const orderInPOSIsCurrent = selectedOrderId === distinctOrderId;
        if (orderInPOSIsCurrent) {
            const orderFromHistory = orderHistory.find(o => o.id === distinctOrderId);
            if (orderFromHistory && (orderItems.length !== orderFromHistory.items.length || total !== orderFromHistory.total || currentOrderNotes !== (orderFromHistory.notes || '')) ) {
                 alert("Unsaved changes in POS for this order. Please use 'Update Table Order & Pay' first to save changes before requesting the bill, or clear the POS if you wish to discard changes.");
                 return;
            }
        }
        setTables(prevTables => prevTables.map(t => {
            if (t.id === tableId) {
                return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === distinctOrderId ? { ...ao, status: 'bill_requested' } : ao) };
            } return t;
        }));
        setOrderHistory(prevOH => prevOH.map(o => o.id === distinctOrderId ? { ...o, status: 'BillRequestedTableOrder', lastUpdatedAt: new Date().toISOString() } : o));
        const targetTable = tables.find(t => t.id === tableId);
        const orderMeta = targetTable?.activeOrders?.find(ao => ao.orderId === distinctOrderId);
        alert(`Bill requested for order "${orderMeta?.displayLabel || distinctOrderId.slice(0,6)}" on table ${targetTable?.name}. Proceed to POS for payment when ready.`);
        setShowTableActionsModal(false);
        if (!orderInPOSIsCurrent) {
            viewDistinctOrderHandler(tableId, distinctOrderId);
        }
    };
    const reopenDistinctOrderHandler = (tableId, distinctOrderId) => {
        setTables(prevTables => prevTables.map(t => {
            if (t.id === tableId) {
                return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === distinctOrderId ? { ...ao, status: 'active' } : ao) };
            } return t;
        }));
        setOrderHistory(prevOH => prevOH.map(o => o.id === distinctOrderId ? { ...o, status: 'ActiveTableOrder', lastUpdatedAt: new Date().toISOString() } : o));
        viewDistinctOrderHandler(tableId, distinctOrderId);
        alert(`Order "${orderHistory.find(o=>o.id===distinctOrderId)?.linkedActiveOrderLabel}" reopened.`);
    };

    const clearPOSPanel = (keepNotes = false) => {
        setOrderItems([]);
        setCustomerName('');
        setDiscount({ type: 'none', value: 0 });
        if (!keepNotes) setCurrentOrderNotes('');
        setSelectedTableId(null);
        setSelectedOrderId(null);
        setSearchTerm('');
        setCustomerPhoneSearchInput('');
        setCustomerSearchMessage('');
        setShowAddCustomerButtonPOS(false);
        setLinkedCustomerId(null);
        setUseLoyaltyPoints(false);
        setLoyaltyAmountToPayInput('');
        setPaymentSplits([]);
        setReceiptDataForDisplay(null);
    };

    const confirmClearPOS = () => {
        clearPOSPanel();
        setShowClearOrderConfirmModal(false);
    };

    const handleClearPOSButtonClick = () => {
        if (orderItems.length > 0 || customerName || currentOrderNotes || selectedOrderId || selectedTableId) {
            setShowClearOrderConfirmModal(true);
        } else {
            clearPOSPanel();
        }
    };


    const handleCustomerPhoneSearch = () => {
        if (!customerPhoneSearchInput.trim()) {
            setCustomerSearchMessage("Please enter a phone number to search.");
            setShowAddCustomerButtonPOS(false);
            setLinkedCustomerId(null);
            return;
        }
        const foundCustomer = customers.find(c => c.phone === customerPhoneSearchInput.trim());
        if (foundCustomer) {
            setCustomerName(foundCustomer.name);
            setLinkedCustomerId(foundCustomer.id);
            setCustomerSearchMessage(`Selected: ${foundCustomer.name} (Phone: ${foundCustomer.phone})`);
            setShowAddCustomerButtonPOS(false);
            if (selectedOrderId) {
                setOrderHistory(prevOH => prevOH.map(o => o.id === selectedOrderId ? {...o, customerId: foundCustomer.id, customer: foundCustomer.name, linkedActiveOrderLabel: foundCustomer.name } : o));
                if (selectedTableId) {
                    setTables(prevTables => prevTables.map(t => {
                        if (t.id === selectedTableId) {
                            return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === selectedOrderId ? { ...ao, displayLabel: foundCustomer.name } : ao)};
                        }
                        return t;
                    }));
                }
            }
        } else {
            setLinkedCustomerId(null);
            setCustomerSearchMessage(`Customer with phone ${customerPhoneSearchInput.trim()} not found.`);
            setShowAddCustomerButtonPOS(true);
        }
    };

    const handleAddNewCustomerFromPOS = () => {
        // Instead of switching tabs, show the modal
        setShowAddCustomerModalPOS(true);
    };

    const handleCustomerAddedFromModal = (newCustomerData) => {
        const newCustomerId = addCustomerHandler(newCustomerData); // Use existing handler to add to main list
        if (newCustomerId) {
            const newCustomer = customers.find(c => c.id === newCustomerId); // Get the full new customer object
            if (newCustomer) {
                setCustomerName(newCustomer.name);
                setLinkedCustomerId(newCustomer.id);
                setCustomerSearchMessage(`Selected: ${newCustomer.name} (Phone: ${newCustomer.phone || 'N/A'})`);
                setCustomerPhoneSearchInput(newCustomer.phone || ''); // Update search input with new phone
                setShowAddCustomerButtonPOS(false); // Hide the "Add New" button

                // If an order is active in POS, link this new customer to it
                if (selectedOrderId) {
                    setOrderHistory(prevOH => prevOH.map(o => o.id === selectedOrderId ? {...o, customerId: newCustomer.id, customer: newCustomer.name, linkedActiveOrderLabel: newCustomer.name } : o));
                    if (selectedTableId) {
                        setTables(prevTables => prevTables.map(t => {
                            if (t.id === selectedTableId) {
                                return { ...t, activeOrders: t.activeOrders.map(ao => ao.orderId === selectedOrderId ? { ...ao, displayLabel: newCustomer.name } : ao)};
                            }
                            return t;
                        }));
                    }
                }
                alert(`Customer ${newCustomer.name} added and linked to current order.`);
            }
        }
        setShowAddCustomerModalPOS(false); // Close the modal
    };


    const handleAddPaymentSplit = () => {
        const currentTotalPaidBySplits = paymentSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
        const remainingForNewSplit = Math.max(0, totalAmountToCoverBySplits - currentTotalPaidBySplits);
        setPaymentSplits(prevSplits => [
            ...prevSplits,
            { id: generateId(), method: 'card', amount: remainingForNewSplit.toFixed(2), tendered: '' } // Default to card, tendered empty
        ]);
    };

    const handleUpdatePaymentSplit = (splitId, field, value) => {
        setPaymentSplits(prevSplits =>
            prevSplits.map(split => {
                if (split.id === splitId) {
                    const updatedSplit = { ...split, [field]: value };
                    if (field === 'amount') { // When amount changes
                        if (updatedSplit.method === 'cash') {
                             // If tendered is less than new amount, or if tendered is empty, update tendered
                            if ((parseFloat(updatedSplit.tendered) || 0) < (parseFloat(value) || 0) || updatedSplit.tendered === '') {
                                updatedSplit.tendered = (parseFloat(value) || 0).toFixed(2);
                            }
                        }
                    } else if (field === 'method') { // When payment method changes
                        if (value === 'cash' && !updatedSplit.tendered) { // If switching to cash and tendered is empty
                            updatedSplit.tendered = updatedSplit.amount; // Default tendered to amount
                        } else if (value !== 'cash') {
                            delete updatedSplit.tendered; // Remove tendered if not cash
                        }
                    }
                    return updatedSplit;
                }
                return split;
            })
        );
    };

    const handleRemovePaymentSplit = (splitId) => {
        setPaymentSplits(prevSplits => prevSplits.filter(split => split.id !== splitId));
    };

    const handleUpdateSettings = (newSettings) => {
        setSettings(newSettings);
        setAdminAccessGranted(!newSettings.adminPin);
    };

    const handleAdminPinSubmit = () => {
        if (enteredAdminPin === settings.adminPin) {
            setAdminAccessGranted(true);
            setShowAdminPinModal(false);
            setEnteredAdminPin('');
            if (targetAdminTab) {
                setActiveTab(targetAdminTab);
                setTargetAdminTab('');
            }
        } else {
            alert("Incorrect PIN.");
            setEnteredAdminPin('');
        }
    };

    const requestAdminAccess = (tabName) => {
        if (!settings.adminPin) {
            setAdminAccessGranted(true);
            setActiveTab(tabName);
            return;
        }
        if (adminAccessGranted) {
            setActiveTab(tabName);
        } else {
            setTargetAdminTab(tabName);
            setShowAdminPinModal(true);
        }
    };

    const handleInitiateReturn = (orderToReturn) => {
        setOrderForReturn(orderToReturn);
        setShowReturnItemsModal(true);
    };

    const handleProcessReturn = (originalOrderId, returnedItemsInThisTransaction, reason, refundAmount) => {
        console.log("Processing return for order:", originalOrderId);
        console.log("Returned Items:", returnedItemsInThisTransaction);
        console.log("Reason:", reason);
        console.log("Refund Amount:", refundAmount);

        const originalOrderForReturn = orderHistory.find(o => o.id === originalOrderId);
        if (!originalOrderForReturn) {
            alert("Original order not found for return processing.");
            return;
        }

        const updatedOrderHistory = orderHistory.map(order => {
            if (order.id === originalOrderId) {
                const finalAggregatedMap = new Map();

                (order.returnedItems || []).forEach(prevItem => {
                    const existing = finalAggregatedMap.get(prevItem.orderItemId);
                    finalAggregatedMap.set(prevItem.orderItemId, {
                        ...prevItem,
                        quantity: (existing?.quantity || 0) + prevItem.quantity,
                    });
                });

                returnedItemsInThisTransaction.forEach(currentNewReturn => {
                    const existing = finalAggregatedMap.get(currentNewReturn.orderItemId);
                    finalAggregatedMap.set(currentNewReturn.orderItemId, {
                        orderItemId: currentNewReturn.orderItemId,
                        productId: existing?.productId || currentNewReturn.productId,
                        name: existing?.name || currentNewReturn.name,
                        displayName: existing?.displayName || currentNewReturn.displayName,
                        selectedOptions: existing?.selectedOptions || currentNewReturn.selectedOptions,
                        itemPriceWithModifiers: existing?.priceAtReturn || currentNewReturn.priceAtReturn,
                        priceAtReturn: existing?.priceAtReturn || currentNewReturn.priceAtReturn,
                        quantity: (existing?.quantity || 0) + currentNewReturn.quantityReturned,
                        productType: existing?.productType || currentNewReturn.productType,
                        bundleItems: existing?.bundleItems || currentNewReturn.bundleItems,
                        bundleComponentDetails: existing?.bundleComponentDetails || currentNewReturn.bundleComponentDetails,
                        image: existing?.image || currentNewReturn.image,
                        category: existing?.category || currentNewReturn.category,
                    });
                });

                const finalAggregatedReturnedItems = Array.from(finalAggregatedMap.values());

                const allOriginalItemsNowReturned = order.items.every(origItem => {
                    const totalReturnedForThisItem = finalAggregatedReturnedItems
                        .filter(ri => ri.orderItemId === origItem.orderItemId)
                        .reduce((sum, ri) => sum + ri.quantity, 0);
                    return totalReturnedForThisItem >= origItem.quantity;
                });

                return {
                    ...order,
                    returnedItems: finalAggregatedReturnedItems,
                    status: allOriginalItemsNowReturned ? 'Fully Returned' : 'Partially Returned',
                    returnReason: order.returnReason ? `${order.returnReason}; ${reason}`.substring(0, 255) : reason.substring(0,255),
                    returnDate: new Date().toISOString()
                };
            }
            return order;
        });

        const returnOrderEntry = {
            id: generateId(),
            originalOrderId: originalOrderId,
            date: new Date().toISOString(),
            items: returnedItemsInThisTransaction.map(ri => ({
                ...ri,
                quantity: ri.quantityReturned,
            })),
            subtotal: -refundAmount,
            tax: 0,
            serviceCharge: 0,
            discount: 0,
            total: -refundAmount,
            customer: originalOrderForReturn.customer,
            customerId: originalOrderForReturn.customerId,
            paymentMethodsUsed: [{ method: 'refund_processed', amount: refundAmount }],
            notes: `Return for Order #${originalOrderId.slice(0,6)}. Reason: ${reason}`.substring(0,255),
            status: 'Returned',
            type: 'return',
            linkedActiveOrderLabel: `Return for #${originalOrderId.slice(0,6)}`
        };

        setOrderHistory([returnOrderEntry, ...updatedOrderHistory]);
        updateInventory(returnedItemsInThisTransaction.map(ri => ({...ri, quantity: ri.quantityReturned})), 'add');

        if (originalOrderForReturn.customerId) {
            const pointsToDeduct = Math.floor(refundAmount);
            if (pointsToDeduct > 0) {
                setCustomers(prevCustomers => prevCustomers.map(c => {
                    if (c.id === originalOrderForReturn.customerId) {
                        const newLoyaltyPoints = Math.max(0, (c.loyaltyPoints || 0) - pointsToDeduct);
                        console.log(`Deducting ${pointsToDeduct} points from customer ${c.name}. Old: ${c.loyaltyPoints}, New: ${newLoyaltyPoints}`);
                        return { ...c, loyaltyPoints: newLoyaltyPoints };
                    }
                    return c;
                }));
            }
        }

        alert(`Return processed for order #${originalOrderId.slice(0,6)}. Refund amount: $${refundAmount.toFixed(2)}`);
        setShowReturnItemsModal(false);
        setOrderForReturn(null);
    };

    const handleAddExpense = (newExpenseData) => {
        const newExpense = {
            ...newExpenseData,
            id: generateId(),
        };
        setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
    };

    const handleRemoveExpense = (expenseId) => {
        if (window.confirm("Are you sure you want to delete this expense record? This action cannot be undone.")) {
            setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== expenseId));
            alert("Expense record deleted.");
        }
    };


    const mainTabs = [
        { name: 'pos', label: 'POS', icon: '🛒' },
        { name: 'tables', label: 'Tables', icon: '🍽️' },
        { name: 'history', label: 'History', icon: '📜' },
        { name: 'kitchen', label: 'Kitchen', icon: '🍳' },
        { name: 'customers', label: 'Customers', icon: '👥' },
        { name: 'expenses', label: 'Expenses', icon: '💸' },
        { name: 'admin', label: 'Admin', icon: '🛠️' },
        { name: 'settings', label: 'Settings', icon: '⚙️' },
        { name: 'dashboard', label: 'Dashboard', icon: '📊' },
        { name: 'support', label: 'Support', icon: '❓' },
    ];
    const currentOrderLabelInPOS = selectedOrderId ? (orderHistory.find(o=>o.id === selectedOrderId)?.linkedActiveOrderLabel || `Order ${selectedOrderId.slice(0,6)}`) : (customerName || 'New Order');
    const currentTableForPOS = selectedTableId ? tables.find(t=>t.id === selectedTableId)?.name : null;
    const isWalkInOrderActive = !selectedTableId && !selectedOrderId && orderItems.length > 0;
    const isTableOrderActiveInPOS = selectedTableId && selectedOrderId;
    const isCurrentOrderSuspended = selectedOrderId && orderHistory.find(o => o.id === selectedOrderId)?.status === 'Suspended';


    return (
        <div className="app-layout">
            <nav className="left-sidebar-tabs">
                 <div className="sidebar-logo">{settings.cafeName || 'Cafe POS'}</div>
                {mainTabs.map(tabInfo => (
                    <button
                        key={tabInfo.name}
                        onClick={() => {
                            if (tabInfo.name === 'admin' || tabInfo.name === 'settings' || tabInfo.name === 'expenses') {
                                requestAdminAccess(tabInfo.name);
                            } else {
                                setActiveTab(tabInfo.name);
                            }
                        }}
                        className={`sidebar-tab ${activeTab === tabInfo.name ? 'active' : ''}`}
                        title={tabInfo.label}
                    >
                        <span className="sidebar-tab-icon">{tabInfo.icon}</span>
                        <span className="sidebar-tab-label">{tabInfo.label}</span>
                        {tabInfo.name === 'history' && <span className="tab-count">({orderHistory.length})</span>}
                        {tabInfo.name === 'kitchen' && <span className="tab-count">({kitchenOrders.filter(o => o.status === 'Pending').length})</span>}
                        {tabInfo.name === 'customers' && <span className="tab-count">({customers.length})</span>}
                        {tabInfo.name === 'tables' && tables.length > 0 && <span className="tab-count">({tables.filter(t => t.status === 'available' && t.activeOrders.length === 0).length}/{tables.length})</span>}
                        {tabInfo.name === 'expenses' && <span className="tab-count">({expenses.length})</span>}
                    </button>
                ))}
            </nav>

            <main className="main-content-area">
                {showAdminPinModal && (
                    <div className="modal-overlay" onClick={() => {setShowAdminPinModal(false); setEnteredAdminPin('');}}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '350px'}}>
                            <div className="modal-header">
                                <h3 className="modal-title">Enter Admin PIN</h3>
                                <button onClick={() => {setShowAdminPinModal(false); setEnteredAdminPin('');}} className="close-btn">&times;</button>
                            </div>
                            <div className="modal-content" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                <input
                                    type="password"
                                    value={enteredAdminPin}
                                    onChange={(e) => setEnteredAdminPin(e.target.value)}
                                    className="form-input"
                                    placeholder="Admin PIN"
                                    autoFocus
                                />
                                <button onClick={handleAdminPinSubmit} className="btn btn-primary">Submit</button>
                            </div>
                        </div>
                    </div>
                )}

                {showClearOrderConfirmModal && (
                    <div className="modal-overlay" onClick={() => setShowClearOrderConfirmModal(false)}>
                        <div className="modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Confirm Clear Order</h3>
                                <button onClick={() => setShowClearOrderConfirmModal(false)} className="close-btn">&times;</button>
                            </div>
                            <div className="modal-content">
                                <p>Are you sure you want to clear the current order items, customer details, and notes from the POS panel? This action cannot be undone for the current unsaved order.</p>
                                {selectedOrderId && <p><em>Note: This will not delete the saved order history for order "{currentOrderLabelInPOS}". It only clears the POS panel.</em></p>}
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowClearOrderConfirmModal(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={confirmClearPOS}>Clear Order</button>
                            </div>
                        </div>
                    </div>
                )}

                {showAddCustomerModalPOS && (
                    <AddCustomerModalPOS
                        onClose={() => setShowAddCustomerModalPOS(false)}
                        onAddCustomerAndSelect={handleCustomerAddedFromModal}
                        initialPhone={customerPhoneSearchInput} // Pass the searched phone number
                    />
                )}


                {activeTab === 'pos' && (
                    <div className="pos-container">
                        <div> {/* Product selection area */}
                            <div className="filters-container">
                                <input type="text" placeholder="Search products..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <div className="category-tabs">{categories.map(category => (<button key={category} onClick={() => setActiveCategory(category)} className={`tab ${activeCategory === category ? 'active' : ''}`}>{category}</button>))}</div>
                            </div>
                            <div className="product-grid">
                                {filteredProducts.length > 0 ? filteredProducts.map(product => {
                                    const currentBundleStock = product.productType === 'bundle' ? calculateBundleAvailability(product, products) : product.stock;
                                    const stockStatus = product.productType === 'bundle' ? (currentBundleStock > 0 ? 'in-stock' : 'out-of-stock') : getStockStatus(product, products);
                                    const isOutOfStock = stockStatus === 'out-of-stock'; const isUnavailable = product.isTemporarilyUnavailable;
                                    let cardClass = 'product-card'; if (isUnavailable) cardClass += ' temporarily-unavailable'; if (isOutOfStock) cardClass += product.productType === 'bundle' ? ' bundle-out-of-stock' : ' temporarily-unavailable';
                                    return (
                                        <div key={product.id} className={cardClass} onClick={() => handleProductClick(product)} style={{ opacity: (isOutOfStock || isUnavailable) ? 0.6 : 1, cursor: (isOutOfStock || isUnavailable) ? 'not-allowed' : 'pointer' }} title={isOutOfStock ? `${product.name} is out of stock` : (isUnavailable ? `${product.name} is temporarily unavailable` : `Add ${product.name}. Stock: ${product.productType === 'bundle' ? currentBundleStock + ' can be made' : product.stock}`)} >
                                            {(stockStatus !== 'in-stock' || isUnavailable) && !product.isArchived && (<div className={`stock-indicator ${isOutOfStock ? 'out-of-stock' : (isUnavailable ? 'status-unavailable' : stockStatus)}`}>{isOutOfStock ? 'Sold Out' : (isUnavailable ? 'Unavailable' : (product.productType === 'standard' ? `Low Stock (${product.stock})` : ''))}</div>)}
                                            <div className="product-image-container">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} /> : null }<span style={{ fontSize: '48px', display: product.imageUrl ? 'none' : 'flex' }}>{product.image}</span></div>
                                            <div className="product-info"><div className="product-name">{product.name} {product.productType === 'bundle' ? '(Bundle)' : ''}</div><div className="product-price">${product.price.toFixed(2)}</div>{(product.variationGroups?.length > 0 || product.modifierGroups?.length > 0) && product.productType === 'standard' && (<div style={{fontSize: '0.8em', color: 'var(--info)'}}>Has Options</div>)}</div>
                                        </div>);
                                }) : <p className="empty-message">No products match your search: "{searchTerm}"</p>}
                            </div>
                        </div>
                        <div className="order-panel">
                            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="tel"
                                    placeholder="Search Customer by Phone"
                                    className="form-input"
                                    value={customerPhoneSearchInput}
                                    onChange={(e) => setCustomerPhoneSearchInput(e.target.value)}
                                    style={{flexGrow: 1}}
                                    disabled={isCurrentOrderSuspended}
                                />
                                <button onClick={handleCustomerPhoneSearch} className="btn btn-info btn-sm" style={{padding: '8px 12px'}} disabled={isCurrentOrderSuspended}>Search</button>
                            </div>
                            {customerSearchMessage && (
                                <div style={{ fontSize: '0.9em', color: showAddCustomerButtonPOS ? 'var(--danger)' : 'var(--success)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{customerSearchMessage}</span>
                                    {showAddCustomerButtonPOS && (
                                        <button onClick={handleAddNewCustomerFromPOS} className="btn btn-success btn-sm" style={{padding: '4px 8px', marginLeft: '10px'}}>
                                            Add New (+)
                                        </button>
                                    )}
                                </div>
                            )}

                             <div style={{ marginBottom: '10px', position: 'relative' }}>
                                <input type="text" placeholder="Order Label / Customer name" className="form-input" value={customerName} onChange={(e) => { setCustomerName(e.target.value); if(linkedCustomerId) setLinkedCustomerId(null); }} list="customerSuggestionsPOS" disabled={isCurrentOrderSuspended} />
                                <datalist id="customerSuggestionsPOS">{customers.map(customer => (<option key={customer.id} value={customer.name}>{customer.phone ? `${customer.name} (${customer.phone})` : customer.name}</option>))}</datalist>
                                {customerName && (<button type="button" className="btn btn-secondary btn-sm" style={{ position: 'absolute', right: '8px', top: '8px', padding: '4px 8px', lineHeight: '1' }} onClick={() => {setCustomerName(''); setLinkedCustomerId(null);}} disabled={isCurrentOrderSuspended} > Clear </button>)}
                            </div>
                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label htmlFor="orderNotes" className="form-label" style={{fontSize: '0.9em'}}>Order Notes:</label>
                                <textarea
                                    id="orderNotes"
                                    className="form-textarea order-notes-textarea"
                                    value={currentOrderNotes}
                                    onChange={(e) => setCurrentOrderNotes(e.target.value)}
                                    rows="2"
                                    placeholder="E.g., Allergy info, special requests..."
                                    disabled={isCurrentOrderSuspended}
                                ></textarea>
                            </div>
                            <h2 style={{ marginBottom: '10px', fontSize: '18px' }}>
                                {currentOrderLabelInPOS}
                                {currentTableForPOS ? ` (Table: ${currentTableForPOS})` : (selectedTableId && !selectedOrderId ? '(Table selected, pick/start order)' : '(Walk-in / To-Go)')}
                                {isCurrentOrderSuspended && <span style={{color: 'var(--warning)', marginLeft: '10px'}}>(Suspended)</span>}
                            </h2>
                            <div className="order-items-container">
                                {orderItems.length === 0 ? (<p className="empty-message" style={{padding: '10px 0'}}>No items in order</p>) : (orderItems.map(item => (
                                    <div key={item.orderItemId} className="order-item">
                                        <div className="item-details"><div className="item-name">{item.displayName}</div>{item.selectedOptions?.length > 0 && (<div className="item-options-display">{item.selectedOptions.map(opt => opt.optionName).join(', ')}</div>)}{item.productType === 'bundle' && item.bundleComponentDetails?.length > 0 && (item.bundleComponentDetails.map((detail, idx) => (<div key={idx} className="bundle-component-display">&nbsp;&nbsp;&nbsp;<em>↳ {detail}</em></div>)))}<div className="item-price-info">${item.itemPriceWithModifiers.toFixed(2)} each</div></div>
                                        <div className="item-controls">
                                            <button className="quantity-btn" onClick={() => updateQuantity(item.orderItemId, (item.quantity - 1))} disabled={item.quantity <= 1 || isCurrentOrderSuspended}>-</button>
                                            <input type="number" className="quantity-input" value={item.quantity} onChange={(e) => updateQuantity(item.orderItemId, e.target.value)} min="1" disabled={isCurrentOrderSuspended}/>
                                            <button className="quantity-btn" onClick={() => updateQuantity(item.orderItemId, (item.quantity + 1))} disabled={isCurrentOrderSuspended} >+</button>
                                            <div className="quick-qty-buttons">
                                                <button className="quick-qty-btn" onClick={() => updateQuantity(item.orderItemId, 'x2')} disabled={isCurrentOrderSuspended}>x2</button>
                                                <button className="quick-qty-btn" onClick={() => updateQuantity(item.orderItemId, 'x3')} disabled={isCurrentOrderSuspended}>x3</button>
                                            </div>
                                            <button className="remove-btn" onClick={() => removeFromOrder(item.orderItemId)} title="Remove item" disabled={isCurrentOrderSuspended}>&times;</button>
                                        </div>
                                    </div>)))}
                            </div>
                            <div className="discount-controls">
                                <select value={discount.type} onChange={(e) => setDiscount({ ...discount, type: e.target.value, value: 0 })} disabled={isCurrentOrderSuspended}><option value="none">No Discount</option><option value="percentage">Percentage %</option><option value="fixed">Fixed Amount $</option></select>
                                {discount.type !== 'none' && (<input type="number" value={discount.value} onChange={(e) => setDiscount({...discount, value: parseFloat(e.target.value) || 0})} min="0" step={discount.type === 'percentage' ? '1' : '0.01'} max={discount.type === 'percentage' ? '100' : subtotal} placeholder={discount.type === 'percentage' ? '%' : '$'} disabled={isCurrentOrderSuspended} />)}
                            </div>
                            <div className="order-totals">
                                <div className="total-row"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                                {discountAmount > 0 && (<div className="total-row"><span>Discount:</span><span style={{color: 'var(--danger)'}}>-${discountAmount.toFixed(2)}</span></div>)}
                                <div className="total-row"><span>Tax ({(settings.taxRate * 100).toFixed(settings.taxRate % 0.01 === 0 ? 0 : 2)}%):</span><span>${tax.toFixed(2)}</span></div>
                                {serviceChargeAmount > 0 && (
                                    <div className="total-row"><span>Service Charge ({(currentServiceChargeRate * 100).toFixed(currentServiceChargeRate % 0.01 === 0 ? 0 : 2)}%):</span><span>${serviceChargeAmount.toFixed(2)}</span></div>
                                )}
                                <div className="total-row grand-total"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                            </div>

                            {isTableOrderActiveInPOS && (
                                 <button className="checkout-btn" onClick={handleUpdateAndPayTableOrder} disabled={orderItems.length === 0 || total < 0 || isCurrentOrderSuspended}>
                                    Update Table Order & Pay
                                </button>
                            )}

                            {(!selectedTableId && (!selectedOrderId || orderHistory.find(o=>o.id===selectedOrderId)?.status === 'ActiveWalkinResumed')) && (
                                <button className="checkout-btn" style={{backgroundColor: 'var(--info)'}} onClick={handleCheckoutToGoOrder} disabled={orderItems.length === 0 || total < 0 || isCurrentOrderSuspended}>
                                    Checkout (To-Go)
                                </button>
                            )}

                            {(orderItems.length > 0 || selectedOrderId) && !isCurrentOrderSuspended && (
                                 <button className="btn btn-secondary" style={{width: '100%', marginTop: '10px', backgroundColor: 'var(--warning)', color: 'var(--dark)'}} onClick={handleSuspendOrder}>
                                    Suspend Order
                                </button>
                            )}
                            {isCurrentOrderSuspended && selectedOrderId && (
                                 <button className="btn btn-primary" style={{width: '100%', marginTop: '10px'}} onClick={() => handleResumeOrder(selectedOrderId)}>
                                    Resume This Order
                                </button>
                            )}


                            {(selectedOrderId || selectedTableId || orderItems.length > 0 || customerPhoneSearchInput || customerName || currentOrderNotes) && (
                                 <button className="btn btn-secondary" style={{width: '100%', marginTop: '10px'}} onClick={handleClearPOSButtonClick}>Clear POS / New Walk-in</button>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'tables' && <TableView tables={tables} onOpenTableActions={openTableActions} selectedTableId={selectedTableId} selectedOrderId={selectedOrderId} />}
                {activeTab === 'history' && <OrderHistoryView orderHistory={orderHistory} markOrderAsDelivered={markOrderAsDelivered} tables={tables} onResumeOrder={handleResumeOrder} onInitiateReturn={handleInitiateReturn} />}
                {activeTab === 'kitchen' && <KitchenDisplayView kitchenOrders={kitchenOrders} markOrderComplete={markOrderComplete} />}
                {activeTab === 'customers' && <CustomersView customers={customers} addCustomer={addCustomerHandler} updateCustomer={updateCustomerHandler} removeCustomer={removeCustomerHandler} orderHistory={orderHistory} onCustomerAddedFromPOS={handleCustomerAddedFromModal} />}
                {activeTab === 'expenses' && adminAccessGranted && <ExpensesView expenses={expenses} onAddExpense={handleAddExpense} onRemoveExpense={handleRemoveExpense} />}


                {activeTab === 'admin' && adminAccessGranted && <AdminView products={products} addProduct={addProductHandler} updateProduct={updateProductHandler} removeProduct={removeProductHandler} archiveProduct={archiveProductHandler} unarchiveProduct={unarchiveProductHandler} categories={categories} onRenameCategory={handleRenameCategory} onExportProducts={handleExportProducts} onImportProducts={handleImportProducts} tables={tables} addTable={addTableHandler} updateTable={updateTableHandler} removeTable={removeTableHandler} />}
                {activeTab === 'settings' && adminAccessGranted && <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />}
                {(activeTab === 'admin' || activeTab === 'settings' || activeTab === 'expenses') && !adminAccessGranted && settings.adminPin && !showAdminPinModal && (
                     <div className="admin-container" style={{textAlign: 'center', padding: '50px'}}>
                        <p>Admin access required. Please enter PIN.</p>
                        <button onClick={() => requestAdminAccess(activeTab)} className="btn btn-primary">Enter PIN</button>
                     </div>
                )}
                {(activeTab === 'admin' || activeTab === 'settings' || activeTab === 'expenses') && !adminAccessGranted && !settings.adminPin && (
                     <div className="admin-container" style={{textAlign: 'center', padding: '50px'}}>
                        <p>To secure Admin, Settings, and Expenses, please set an Admin PIN in Settings.</p>
                        {activeTab === 'settings' ? <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} /> : <button onClick={() => requestAdminAccess('settings')} className="btn btn-primary">Go to Settings</button>}
                     </div>
                )}

                {activeTab === 'dashboard' && <DashboardView orderHistory={orderHistory} products={products} customers={customers} />}
                {activeTab === 'support' && <SupportView addSupportTicket={addSupportTicket} supportTickets={supportTickets} emailJsReady={emailJsReady} />}

                {showOptionsModal && productForOptions && (<OptionsSelectionModal product={productForOptions} onClose={handleOptionsModalClose} onAddToCart={addConfiguredItemToOrder} />)}

                {showPaymentModal && (
                    <div className="modal-overlay" onClick={handleModalClose}>
                        <div className="modal payment-modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">{showReceipt && receiptDataForDisplay ? "Order Confirmation" : "Process Payment"}</div>
                                <button className="close-btn" onClick={handleModalClose}>&times;</button>
                            </div>
                            {!showReceipt ? (
                                <div className="payment-form">
                                    <div className="form-group">
                                        <label className="form-label">Total Order Amount</label>
                                        <input type="text" className="form-input" value={`$${total.toFixed(2)}`} readOnly style={{fontWeight: 'bold', fontSize: '18px'}}/>
                                    </div>

                                    {linkedCustomerId && customers.find(c=>c.id === linkedCustomerId)?.loyaltyPoints > 0 && (
                                        <div className="form-group loyalty-payment-section">
                                            <label className="form-label" style={{display: 'flex', alignItems: 'center'}}>
                                                <input type="checkbox" checked={useLoyaltyPoints} onChange={(e) => {
                                                    setUseLoyaltyPoints(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setLoyaltyAmountToPayInput('');
                                                    } else {
                                                        const customer = customers.find(c => c.id === linkedCustomerId);
                                                        const maxLoyaltyValue = (customer?.loyaltyPoints || 0) * LOYALTY_POINT_VALUE;
                                                        setLoyaltyAmountToPayInput(Math.min(total, maxLoyaltyValue).toFixed(2));
                                                    }
                                                }} style={{marginRight: '8px', width: 'auto'}}/>
                                                Use Loyalty Points? (Available: {customers.find(c=>c.id === linkedCustomerId)?.loyaltyPoints || 0} pts = ${( (customers.find(c=>c.id === linkedCustomerId)?.loyaltyPoints || 0) * LOYALTY_POINT_VALUE).toFixed(2)})
                                            </label>
                                            {useLoyaltyPoints && (
                                                <>
                                                    <label className="form-label" htmlFor="loyaltyAmountInput">Amount to Pay with Points ($):</label>
                                                    <input
                                                        type="number"
                                                        id="loyaltyAmountInput"
                                                        className="form-input"
                                                        value={loyaltyAmountToPayInput}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            const customer = customers.find(c => c.id === linkedCustomerId);
                                                            const maxLoyaltyValue = (customer?.loyaltyPoints || 0) * LOYALTY_POINT_VALUE;
                                                            if (isNaN(val) || val < 0) {
                                                                setLoyaltyAmountToPayInput('0');
                                                            } else {
                                                                setLoyaltyAmountToPayInput(Math.min(val, total, maxLoyaltyValue).toFixed(2));
                                                            }
                                                        }}
                                                        step="0.01" min="0"
                                                        max={Math.min(total, (customers.find(c=>c.id === linkedCustomerId)?.loyaltyPoints || 0) * LOYALTY_POINT_VALUE).toFixed(2)}
                                                    />
                                                    {loyaltyAmountToPayInput && <p style={{fontSize: '0.9em', color: 'var(--primary)'}}>Points to be used: {pointsNeededForPayment}</p>}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <hr style={{margin: '15px 0'}}/>

                                    <div className="form-group">
                                        <label className="form-label" style={{fontWeight:'bold'}}>Amount to Cover by Other Methods: ${totalAmountToCoverBySplits.toFixed(2)}</label>
                                    </div>

                                    {paymentSplits.map((split, index) => (
                                        <div key={split.id} className="payment-split-item">
                                            <select value={split.method} onChange={(e) => handleUpdatePaymentSplit(split.id, 'method', e.target.value)} className="form-input">
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="mobile">Mobile</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={split.amount}
                                                onChange={(e) => handleUpdatePaymentSplit(split.id, 'amount', e.target.value)}
                                                className="form-input"
                                                step="0.01" min="0"
                                            />
                                            {split.method === 'cash' && (
                                                <input
                                                    type="number"
                                                    placeholder="Tendered"
                                                    value={split.tendered || ''}
                                                    onChange={(e) => handleUpdatePaymentSplit(split.id, 'tendered', e.target.value)}
                                                    className="form-input"
                                                    step="0.01" min={parseFloat(split.amount) || 0}
                                                />
                                            )}
                                            {paymentSplits.length > 1 && <button onClick={() => handleRemovePaymentSplit(split.id)} className="btn btn-danger btn-sm">&times;</button>}
                                        </div>
                                    ))}
                                    <button onClick={handleAddPaymentSplit} className="btn btn-secondary btn-sm" style={{alignSelf: 'flex-start', marginTop: '5px'}}
                                     disabled={Math.abs(overallRemainingDue) < 0.01 && paymentSplits.length > 0 && totalAmountToCoverBySplits > 0}
                                    >
                                        + Add Payment Method
                                    </button>

                                    {paymentSplits.length > 0 && (
                                        <div style={{marginTop: '10px', fontSize: '0.9em'}}>
                                            <p>Total Paid by Splits: ${totalPaidBySplits.toFixed(2)}</p>
                                            <p style={{fontWeight: overallRemainingDue > 0.001 ? 'bold' : 'normal', color: overallRemainingDue > 0.001 ? 'var(--danger)' : 'var(--success)'}}>
                                                Remaining to Cover by Splits: ${overallRemainingDue.toFixed(2)}
                                            </p>
                                            {overallChangeDue > 0 && <p style={{color: 'var(--accent)'}}>Total Change from Cash: ${overallChangeDue.toFixed(2)}</p>}
                                        </div>
                                    )}

                                    <div className="modal-actions">
                                        <button className="btn btn-secondary" onClick={handleModalClose}>Cancel</button>
                                        <button className="btn btn-primary" onClick={processPayment}
                                            disabled={
                                                Math.abs(overallRemainingDue) > 0.001 ||
                                                (useLoyaltyPoints && (!linkedCustomerId || pointsNeededForPayment > (customers.find(c => c.id === linkedCustomerId)?.loyaltyPoints || 0) )) ||
                                                paymentSplits.some(s => s.method === 'cash' && (parseFloat(s.tendered) || 0) < (parseFloat(s.amount) || 0))
                                            }
                                        >
                                            Process Payment
                                        </button>
                                    </div>
                                </div>
                            ) : receiptDataForDisplay ? (
                                <div className="receipt-display-area">
                                    <div className="receipt-header">
                                        {receiptDataForDisplay.showReceiptLogo && receiptDataForDisplay.cafeLogoUrl && (
                                            <div className="receipt-logo">
                                                <img src={receiptDataForDisplay.cafeLogoUrl} alt="Cafe Logo" />
                                            </div>
                                        )}
                                        <div className="receipt-cafe-name">{receiptDataForDisplay.cafeName}</div>
                                        <div className="receipt-cafe-details">
                                            {receiptDataForDisplay.cafeAddress && <p>{receiptDataForDisplay.cafeAddress}</p>}
                                            {receiptDataForDisplay.cafePhone && <p>Phone: {receiptDataForDisplay.cafePhone}</p>}
                                            {receiptDataForDisplay.cafeWebsite && <p>{receiptDataForDisplay.cafeWebsite}</p>}
                                        </div>
                                    </div>

                                    <div className="receipt-order-info">
                                        <p><strong>Date:</strong> <span>{new Date(receiptDataForDisplay.date).toLocaleString()}</span></p>
                                        <p><strong>Order:</strong> <span>{receiptDataForDisplay.customerName} {receiptDataForDisplay.orderId !== 'NEW' ? `(#${receiptDataForDisplay.orderId.slice(0,6)})` : '(New Order)'}</span></p>
                                    </div>

                                    <div className="receipt-items-header">
                                        <div className="item-name-col">Item</div>
                                        <div className="item-qty-col">Qty</div>
                                        <div className="item-price-col">Price</div>
                                        <div className="item-total-col">Total</div>
                                    </div>
                                    <div className="receipt-items">
                                        {receiptDataForDisplay.items.map((item, index) => (
                                            <React.Fragment key={item.orderItemId || index}>
                                                <div className="receipt-item">
                                                    <span className="item-name-col">{item.displayName}</span>
                                                    <span className="item-qty-col">{item.quantity}</span>
                                                    <span className="item-price-col">${item.itemPriceWithModifiers.toFixed(2)}</span>
                                                    <span className="item-total-col">${(item.itemPriceWithModifiers * item.quantity).toFixed(2)}</span>
                                                </div>
                                                {item.productType === 'bundle' && item.bundleComponentDetails?.length > 0 &&
                                                    item.bundleComponentDetails.map((detail, idx) => (
                                                        <div key={`bc-${index}-${idx}`} className="bundle-component-line">↳ {detail}</div>
                                                    ))
                                                }
                                                {item.productType !== 'bundle' && item.selectedOptions?.length > 0 && (
                                                    <div className="item-options-line">({item.selectedOptions.map(opt => opt.optionName).join(', ')})</div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    {receiptDataForDisplay.notes && (
                                        <div className="receipt-notes-section">
                                            <h4>Order Notes:</h4>
                                            <p>{receiptDataForDisplay.notes}</p>
                                        </div>
                                    )}

                                    <div className="receipt-totals">
                                        <div className="total-line">
                                            <span>Subtotal:</span>
                                            <span>${receiptDataForDisplay.subtotal.toFixed(2)}</span>
                                        </div>
                                        {receiptDataForDisplay.discountAmount > 0 && (
                                            <div className="total-line">
                                                <span>Discount:</span>
                                                <span>-${receiptDataForDisplay.discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="total-line">
                                            <span>Tax ({(settings.taxRate * 100).toFixed(settings.taxRate % 1 === 0 ? 0 : 2)}%):</span>
                                            <span>${receiptDataForDisplay.tax.toFixed(2)}</span>
                                        </div>
                                        {receiptDataForDisplay.serviceCharge > 0 && (
                                            <div className="total-line">
                                                <span>Service Charge ({(settings.serviceChargeRate * 100).toFixed(settings.serviceChargeRate % 1 === 0 ? 0 : 2)}%):</span>
                                                <span>${receiptDataForDisplay.serviceCharge.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="total-line grand-total">
                                            <span>TOTAL:</span>
                                            <span>${receiptDataForDisplay.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {receiptDataForDisplay.paymentMethodsUsed && receiptDataForDisplay.paymentMethodsUsed.length > 0 && (
                                        <div className="receipt-payment-details">
                                            <h4>Payment Details:</h4>
                                            {receiptDataForDisplay.paymentMethodsUsed.map((pm, index) => (
                                                <div key={index} className="payment-line">
                                                    <span>{pm.method.charAt(0).toUpperCase() + pm.method.slice(1)}:</span>
                                                    <span>
                                                        ${pm.amount.toFixed(2)}
                                                        {pm.method === 'loyalty' && pm.points ? ` (${pm.points} pts)` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                            {(() => {
                                                const cashPayments = receiptDataForDisplay.paymentMethodsUsed.filter(pm => pm.method === 'cash');
                                                const totalCashReceived = cashPayments.reduce((sum, pm) => sum + (pm.received || 0), 0);
                                                const totalCashAmountDue = cashPayments.reduce((sum, pm) => sum + pm.amount, 0);
                                                const change = totalCashReceived - totalCashAmountDue;
                                                if (change > 0.001) {
                                                    return (
                                                        <>
                                                        <div className="payment-line" style={{marginTop: '5px', borderTop: '1px dotted var(--light-grey)', paddingTop: '5px'}}>
                                                            <span>Total Cash Received:</span>
                                                            <span>${totalCashReceived.toFixed(2)}</span>
                                                        </div>
                                                        <div className="payment-line">
                                                            <span>Change Given:</span>
                                                            <span>${change.toFixed(2)}</span>
                                                        </div>
                                                        </>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}

                                    <div className="receipt-footer">
                                        {receiptDataForDisplay.receiptHeaderMsg && <p>{receiptDataForDisplay.receiptHeaderMsg}</p>}
                                        {receiptDataForDisplay.receiptFooterMsg && <p>{receiptDataForDisplay.receiptFooterMsg}</p>}
                                    </div>
                                     <div className="modal-actions" style={{marginTop: '20px', borderTop: '1px solid var(--light-grey)', paddingTop: '15px'}}>
                                        <button className="btn btn-secondary" onClick={() => { setShowReceipt(false); /* Keep receiptDataForDisplay for re-payment if needed */ }}>Back to Payment</button>
                                        <button className="btn btn-primary" onClick={completeOrder}>Complete Order</button>
                                        <button className="btn btn-primary" onClick={() => { printReceipt(); completeOrder();}}>Print & Complete</button>
                                    </div>
                                </div>
                            ) : <p>Loading receipt...</p>}
                        </div>
                    </div>
                )}

                {showTableActionsModal && tableForActions && (
                    <TableActionsModal
                        table={tableForActions}
                        orderHistory={orderHistory}
                        onClose={() => setShowTableActionsModal(false)}
                        onUpdateTableGeneralStatus={updateTableGeneralStatusHandler}
                        onStartNewDistinctOrder={startNewDistinctOrderHandler}
                        onViewDistinctOrder={viewDistinctOrderHandler}
                        onRequestBillForDistinctOrder={requestBillForDistinctOrderHandler}
                        onReopenDistinctOrder={reopenDistinctOrderHandler}
                    />
                )}

                {showReturnItemsModal && orderForReturn && (
                    <ReturnItemsModal
                        order={orderForReturn}
                        onClose={() => { setShowReturnItemsModal(false); setOrderForReturn(null); }}
                        onProcessReturn={handleProcessReturn}
                    />
                )}
            </main>
        </div>
    );
}

console.log("React script end, rendering App - Multi-Order Version with Suspend/Resume & Settings");
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
