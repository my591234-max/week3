import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal } from "bootstrap";

// 取出環境變數
const { VITE_BASE_URL, VITE_API_PATH } = import.meta.env;

function App() {
  const [isAuth, setIsAuth] = useState(false); // 登入狀態
  const [products, setProducts] = useState([]); // 產品列表

  // 產品預設值
  const defaultModalState = {
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: 0,
    imagesUrl: [],
  };

  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [modalType, setModalType] = useState(""); // 判斷是 'new' 還是 'edit'

  // Ref 用來操作 DOM 元素 (Bootstrap Modal)
  const productModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const productModalInstance = useRef(null);
  const deleteModalInstance = useRef(null);

  // 初始化 Bootstrap Modal 實例
  useEffect(() => {
    if (isAuth) {
      // 確保 DOM 渲染後再綁定 Modal
      productModalInstance.current = new Modal(productModalRef.current, {
        backdrop: "static",
      });
      deleteModalInstance.current = new Modal(deleteModalRef.current, {
        backdrop: "static",
      });
      getProducts();
    }
  }, [isAuth]);

  // --- 登入相關邏輯 ---
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${VITE_BASE_URL}/admin/signin`, formData);
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)};`;
      axios.defaults.headers.common["Authorization"] = token;
      setIsAuth(true);
    } catch (err) {
      alert("登入失敗: " + (err.response?.data?.message || err.message));
    }
  };

  const checkLogin = async () => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
      try {
        await axios.post(`${VITE_BASE_URL}/api/user/check`);
        setIsAuth(true);
      } catch (err) {
        setIsAuth(false);
      }
    }
  };

  useEffect(() => {
    checkLogin();
  }, []);

  // --- 產品 CRUD 邏輯 ---

  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/products`
      );
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (type, item) => {
    setModalType(type);
    if (type === "new") {
      setTempProduct(defaultModalState);
      productModalInstance.current.show();
    } else if (type === "edit") {
      setTempProduct({ ...item });
      productModalInstance.current.show();
    } else if (type === "delete") {
      setTempProduct(item);
      deleteModalInstance.current.show();
    }
  };

  const handleUpdateProduct = async () => {
    let apiMethod = "post";
    let apiUrl = `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/product`;

    if (modalType === "edit") {
      apiMethod = "put";
      apiUrl = `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/product/${tempProduct.id}`;
    }

    try {
      const dataToSend = {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
        },
      };

      await axios[apiMethod](apiUrl, dataToSend);
      productModalInstance.current.hide();
      getProducts();
      alert(`產品${modalType === "new" ? "新增" : "更新"}成功`);
    } catch (err) {
      alert("操作失敗: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await axios.delete(
        `${VITE_BASE_URL}/api/${VITE_API_PATH}/admin/product/${tempProduct.id}`
      );
      deleteModalInstance.current.hide();
      getProducts();
      alert("產品刪除成功");
    } catch (err) {
      alert("刪除失敗: " + (err.response?.data?.message || err.message));
    }
  };

  const handleModalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  // 處理多圖欄位
  const handleImageChange = (index, value) => {
    const newImages = [...(tempProduct.imagesUrl || [])];
    newImages[index] = value;
    // 去除空字串 (Optional, 視需求決定是否要在此時清理)
    setTempProduct({ ...tempProduct, imagesUrl: newImages });
  };

  const addImageField = () => {
    const newImages = [...(tempProduct.imagesUrl || []), ""];
    setTempProduct({ ...tempProduct, imagesUrl: newImages });
  };

  const removeImageField = () => {
    const newImages = [...(tempProduct.imagesUrl || [])];
    newImages.pop();
    setTempProduct({ ...tempProduct, imagesUrl: newImages });
  };

  return (
    <div className="container">
      {isAuth ? (
        // 產品列表
        <div className="row mt-5">
          <div className="col-md-12">
            <div className="d-flex justify-content-between mb-4 align-items-center">
              <h2>產品列表</h2>
              <button
                className="btn btn-primary"
                onClick={() => openModal("new")}
              >
                建立新產品
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>分類</th>
                  <th>產品名稱</th>
                  <th>原價</th>
                  <th>售價</th>
                  <th>是否啟用</th>
                  <th>編輯</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category}</td>
                    <td>{item.title}</td>
                    <td>{item.origin_price}</td>
                    <td>{item.price}</td>
                    <td>
                      <span
                        className={
                          item.is_enabled ? "text-success" : "text-danger"
                        }
                      >
                        {item.is_enabled ? "啟用" : "未啟用"}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openModal("edit", item)}
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openModal("delete", item)}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // 登入表單
        <div className="row justify-content-center w-100">
          <div className="col-md-6">
            <h1 className="h3 mb-3 font-weight-normal text-center">請先登入</h1>
            <form className="form-signin" onSubmit={handleLogin}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder="name@example.com"
                  required
                  autoFocus
                  onChange={handleInputChange}
                />
                <label htmlFor="username">Email address</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  placeholder="Password"
                  required
                  onChange={handleInputChange}
                />
                <label htmlFor="password">Password</label>
              </div>
              <button
                className="btn btn-lg btn-primary w-100 mt-3"
                type="submit"
              >
                登入
              </button>
            </form>
            <p className="mt-5 mb-3 text-muted text-center">
              © 2024~∞ - 六角學院
            </p>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <div
        className="modal fade"
        ref={productModalRef}
        id="productModal"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header bg-dark text-white">
              <h5 className="modal-title">
                <span>{modalType === "new" ? "新增產品" : "編輯產品"}</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-3">
                    <label htmlFor="imageUrl" className="form-label">
                      主要圖片
                    </label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      name="imageUrl"
                      placeholder="請輸入圖片連結"
                      value={tempProduct.imageUrl}
                      onChange={handleModalInputChange}
                    />
                    <img
                      className="img-fluid"
                      src={tempProduct.imageUrl}
                      alt=""
                    />
                  </div>
                  <h3 className="mb-3">多圖新增</h3>
                  {Array.isArray(tempProduct.imagesUrl) &&
                    tempProduct.imagesUrl.map((url, index) => (
                      <div key={index} className="mb-3">
                        <label className="form-label">
                          圖片網址 {index + 1}
                        </label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="請輸入圖片連結"
                          value={url}
                          onChange={(e) =>
                            handleImageChange(index, e.target.value)
                          }
                        />
                        {url && (
                          <img src={url} alt="" className="img-fluid mb-2" />
                        )}
                      </div>
                    ))}
                  <div className="d-flex justify-content-between gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={addImageField}
                    >
                      新增圖片
                    </button>
                    {tempProduct.imagesUrl?.length > 0 && (
                      <button
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={removeImageField}
                      >
                        刪除最後一張
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                      value={tempProduct.title}
                      onChange={handleModalInputChange}
                    />
                  </div>
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">
                        分類
                      </label>
                      <input
                        id="category"
                        name="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                        value={tempProduct.category}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">
                        單位
                      </label>
                      <input
                        id="unit"
                        name="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入單位"
                        value={tempProduct.unit}
                        onChange={handleModalInputChange}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        id="origin_price"
                        name="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                        value={tempProduct.origin_price}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                        value={tempProduct.price}
                        onChange={handleModalInputChange}
                      />
                    </div>
                  </div>
                  <hr />
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                      value={tempProduct.description}
                      onChange={handleModalInputChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                      value={tempProduct.content}
                      onChange={handleModalInputChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="is_enabled"
                        name="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={!!tempProduct.is_enabled}
                        onChange={handleModalInputChange}
                      />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateProduct}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div
        className="modal fade"
        ref={deleteModalRef}
        id="delProductModal"
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content border-0">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <span>刪除產品</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              是否刪除{" "}
              <strong className="text-danger">{tempProduct.title}</strong>{" "}
              商品(刪除後將無法恢復)。
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteProduct}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
