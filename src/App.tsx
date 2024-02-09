import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Card, Divider, Button, Modal, Form, Input, Select, Upload, message} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import {UploadChangeParam, UploadFile} from "antd/lib/upload";

const {Option} = Select;

interface Menu {
    id: number;
    name: string;
    description: string;
    price: number;
    psize: string;
    img: string;
    category: Category;
}

interface Category {
    id: number;
    name: string;
}

const BackendUrl = 'http://localhost:8080/api';

const App: React.FC = () => {
    const [menusByCategory, setMenusByCategory] = useState<{ [key: string]: Menu[] }>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
    const [form] = Form.useForm();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [editMenuModalVisible, setEditMenuModalVisible] = useState<boolean>(false);
    const [imageFileList, setImageFileList] = useState<any[]>([]); // Добавляем состояние для списка файлов
    const [editMenu, setEditMenu] = useState<Menu | null>(null);
    const [editImageModalVisible, setEditImageModalVisible] = useState<boolean>(false);
    const [editImageMenu, setEditImageMenu] = useState<Menu | null>(null);
    const [editInfoModalVisible, setEditInfoModalVisible] = useState<boolean>(false); // Переменная для модального окна редактирования информации


    useEffect(() => {
        fetchMenus();
        fetchCategories();
    }, []);

    const fetchMenus = () => {
        axios.get<Menu[]>(`${BackendUrl}/menu`)
            .then(response => {
                const menus = response.data;
                const menusByCategory: { [key: string]: Menu[] } = {};
                menus.forEach(menu => {
                    if (!menusByCategory[menu.category.name]) {
                        menusByCategory[menu.category.name] = [];
                    }
                    menusByCategory[menu.category.name].push(menu);
                });
                setMenusByCategory(menusByCategory);
            })
            .catch(error => {
                console.error('Error fetching menus:', error);
            });
    };

    const fetchCategories = () => {
        axios.get<Category[]>(`${BackendUrl}/category`)
            .then(response => {
                setCategories(response.data);
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
            });
    };

    const handleAddMenu = (values: any) => {
        const {img, categoryId, ...menu} = values;

        // Создаем новый экземпляр FormData
        const formData = new FormData();
        console.log('Selected Image:', img);
        // Добавляем файл изображения в FormData
        formData.append('img', img[0].originFileObj);

        // Добавляем данные меню в формате JSON в FormData
        formData.append('menu', JSON.stringify({...menu}));
        console.log(formData)

        // Отправляем запрос на сервер
        axios.post(`${BackendUrl}/menu/${categoryId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(() => {
                // Обновляем список меню после успешного добавления
                fetchMenus();
                // Закрываем модальное окно
                setMenuModalVisible(false);
                // Сбрасываем значения формы
                form.resetFields();
            })
            .catch(error => {
                console.error('Error adding menu item:', error);
            });
    };

    const handleAddCategory = (values: any) => {
        axios.post(`${BackendUrl}/category`, values)
            .then(() => {
                fetchCategories();
                setCategoryModalVisible(false);
                form.resetFields();
            })
            .catch(error => {
                console.error('Error adding category:', error);
            });
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
    };

    const handleOpenEditModal = (menu: Menu) => {
        setEditMenu(menu);
        setEditInfoModalVisible(true); // Открываем модальное окно редактирования информации
    };

    const handleCloseEditModal = () => {
        setEditInfoModalVisible(false); // Закрываем модальное окно редактирования информации
    };


    const handleUpdateInfo = (values: any) => {
        const updatedMenu = {...editMenu, ...values};
        axios.put(`${BackendUrl}/menu/${editMenu?.id}`, updatedMenu)
            .then(response => {
                console.log('Updated menu:', response.data);
                fetchMenus(); // Обновляем список товаров
                setEditMenuModalVisible(false); // Закрываем модальное окно редактирования
                form.resetFields(); // Сбрасываем значения формы
            })
            .catch(error => {
                console.error('Error updating menu item:', error);
            });
    };

    const handleImageChange = (id: number | undefined, fileList: UploadFile<any>[]) => {
        if (id && fileList.length > 0) { // Проверяем, что id существует и есть выбранный файл
            const imgFile = fileList[0].originFileObj; // Получаем объект файла из информации о загруженном файле

            if (imgFile) { // Проверяем, что файл существует
                const formData = new FormData();
                formData.append('img', imgFile);

                axios.put(`${BackendUrl}/menu/${id}/image`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                    .then(() => {
                        fetchMenus();
                        setEditImageModalVisible(false);
                        setImageFileList([]);
                    })
                    .catch(error => {
                        console.error('Error updating image:', error);
                    });
            }
        }
    };

    const handleOpenEditImageModal = (menu: Menu) => {
        setEditImageMenu(menu); // Устанавливаем меню для редактирования
        setEditImageModalVisible(true); // Открываем модальное окно редактирования изображения
    };

    return (
        <div className="container mx-auto mt-5">
            <h1 className="text-3xl mb-5">Menu Items by Category</h1>
            <div className="mb-5">
                <Button type="default" onClick={() => setMenuModalVisible(true)}>Add Menu Item</Button>
                <Button type="default" onClick={() => setCategoryModalVisible(true)} className="ml-3">Add
                    Category</Button>
                <Select
                    defaultValue="all"
                    style={{width: 120, marginLeft: '1rem'}}
                    onChange={handleCategoryChange}
                >
                    <Option value="all">All</Option>
                    {categories.map(category => (
                        <Option key={category.id} value={category.name}>{category.name}</Option>
                    ))}
                </Select>
            </div>

            {categories.map(category => (
                <div key={category.id} className="mb-5">
                    <h2 className="text-xl font-semibold mb-3">{category.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedCategory === 'all' || selectedCategory === category.name ? (
                            menusByCategory[category.name]?.map(menu => (
                                <Card key={menu.id}
                                      hoverable style={{width: '100%'}}
                                      className="mb-4">
                                    <img alt={menu.name} src={menu.img}
                                         style={{width: '100%', maxHeight: '150px', objectFit: 'cover'}}/>
                                    <div className="p-2">
                                        <h3 className="text-lg font-semibold mb-2">{menu.name}</h3>
                                        <p className="mb-2">{menu.description}</p>
                                        <p className="text-gray-700 mb-2">Price: ${menu.price}</p>
                                        <p className="text-gray-700 mb-2">Size: {menu.psize}</p>
                                        <div>
                                            <Button type="default" onClick={() => handleOpenEditModal(menu)}
                                                    className="mr-2">
                                                Edit Info
                                            </Button>
                                            <Button type="default" onClick={() => handleOpenEditImageModal(menu)}>
                                                Edit Image
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : null}
                    </div>
                    <Divider/>
                </div>
            ))}

            <Modal
                title="Add Menu Item"
                visible={menuModalVisible}
                onCancel={() => {
                    setMenuModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleAddMenu}>
                    <Form.Item name="name" label="Name" rules={[{required: true}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="description" label="Description" rules={[{required: true}]}>
                        <Input.TextArea/>
                    </Form.Item>
                    <Form.Item name="price" label="Price" rules={[{required: true}]}>
                        <Input type="number"/>
                    </Form.Item>
                    <Form.Item name="size" label="Size" rules={[{required: false}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        name="img"
                        label="Image"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => e.fileList}
                    >
                        <Upload
                            name="img" // Убедитесь, что имя файла соответствует ожидаемому на сервере
                            listType="picture"
                            beforeUpload={() => false} // Отключаем автоматическую загрузку
                            onChange={({fileList}) => form.setFieldsValue({img: fileList})} // Обновляем значение поля формы
                        >
                            <Button icon={<UploadOutlined/>}>Click to upload</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="categoryId" label="Category" rules={[{required: true}]}>
                        <Select>
                            {categories.map(category => (
                                <Option key={category.id} value={category.id}>{category.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Button type="default" htmlType="submit">Add</Button>
                </Form>
            </Modal>


            <Modal
                title="Add Category"
                visible={categoryModalVisible}
                onCancel={() => {
                    setCategoryModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleAddCategory}>
                    <Form.Item name="name" label="Name" rules={[{required: true}]}>
                        <Input/>
                    </Form.Item>
                    <Button type="default" htmlType="submit">Add</Button>
                </Form>
            </Modal>

            <Modal
                title={`${editMenu?.name || 'Menu Item'}  ${editMenu?.psize || ''}`}
                visible={editInfoModalVisible} // Используем новую переменную состояния
                onCancel={handleCloseEditModal} // Обработчик закрытия модального окна
                footer={null}
            >
                {/* Форма для редактирования */}
                <Form form={form} onFinish={handleUpdateInfo}>
                    {/* Добавьте поля формы для редактирования товара, используя данные из editMenu */}
                    <Form.Item name="name" label="Name" initialValue={editMenu?.name} rules={[{required: false}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="description" label="Description" initialValue={editMenu?.description}
                               rules={[{required: false}]}>
                        <Input.TextArea/>
                    </Form.Item>
                    <Form.Item name="price" label="Price" initialValue={editMenu?.price} rules={[{required: false}]}>
                        <Input type="number"/>
                    </Form.Item>
                </Form>
                <Button type="default" onClick={() => form.submit()}>
                    Save
                </Button>
            </Modal>

            <Modal
                title={`${editImageMenu?.name || 'Menu Item'}  ${editImageMenu?.psize || ''}`}
                visible={editImageModalVisible}
                onCancel={() => {
                    setEditImageModalVisible(false);
                    form.resetFields(); // Сбрасываем значения формы при закрытии модального окна
                }}
                footer={[
                    <Button
                        key="save"
                        type="default"
                        onClick={() => {
                            if (editImageMenu?.id) {
                                handleImageChange(editImageMenu?.id, imageFileList); // Передаем id и список файлов
                            } else {
                                console.error("Edit menu id is not available.");
                            }
                            setEditImageModalVisible(false);
                        }}
                    >
                        Save
                    </Button>
                ]}
            >
                <Upload
                    name="img"
                    listType="picture"
                    fileList={imageFileList}
                    beforeUpload={() => false}
                    onChange={({fileList}) => setImageFileList(fileList)} // Обновляем список файлов
                >
                    <Button icon={<UploadOutlined/>}>Click to upload</Button>
                </Upload>
            </Modal>
        </div>
    );
};

export default App;
