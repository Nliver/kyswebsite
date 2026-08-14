import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Image,
  Modal,
  Upload,
  Input,
  Space,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Card,
  Row,
  Col,
  Select,
  Typography,
  Statistic,
} from 'antd';
import {
  Upload as UploadIcon,
  Trash2,
  Copy,
  Edit,
  RotateCcw,
  Eye,
  Download,
  Image as ImageIcon,
  Cloud,
} from 'lucide-react';
import type { UploadFile, UploadProps } from 'antd';
import { CloudinaryImage, ImageListResponse } from '../api/cloudinary/images';
import { uploadImgToCloud, deleteImgFromCloud } from '../../lib/cloudinary';
import styles from './index.module.css';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface MediaManagerProps {
  // 空接口保留用于未来扩展
}

const MediaManager: React.FC<MediaManagerProps> = () => {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [currentPage, setCurentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<CloudinaryImage | null>(null);
  const [editingImage, setEditingImage] = useState<CloudinaryImage | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editTags, setEditTags] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // 获取图片列表
  const fetchImages = async (page: number = 1, search?: string, folder?: string, resetData: boolean = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        max_results: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (folder) params.append('folder', folder);
      if (page > 1 && nextCursor) params.append('next_cursor', nextCursor);

      const response = await fetch(`/api/cloudinary/images?${params}`);
      const data: ImageListResponse = await response.json();

      if (resetData || page === 1) {
        setImages(data.images);
      } else {
        setImages(prev => [...prev, ...data.images]);
      }
      
      setTotal(data.total_count);
      setNextCursor(data.next_cursor);
    } catch (error) {
      message.error('获取图片列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchImages();
  }, [pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurentPage(1);
    fetchImages(1, value, selectedFolder);
  };

  // 文件夹过滤
  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    setCurentPage(1);
    fetchImages(1, searchQuery, folder);
  };

  // 上传文件
  const uploadProps: UploadProps = {
    multiple: true,
    fileList,
    beforeUpload: () => false, // 阻止自动上传
    onChange: ({ fileList }) => setFileList(fileList),
    accept: 'image/*',
  };

  // 处理上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = fileList.map(file => {
        if (file.originFileObj) {
          return uploadImgToCloud(file.originFileObj);
        }
        return Promise.reject(new Error('无效文件'));
      });

      await Promise.all(uploadPromises);
      message.success(`成功上传 ${fileList.length} 个文件`);
      setFileList([]);
      setUploadModalVisible(false);
      fetchImages(1, searchQuery, selectedFolder); // 刷新列表
    } catch (error) {
      message.error('上传失败');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // 删除图片
  const handleDelete = async (publicId: string) => {
    try {
      const success = await deleteImgFromCloud(publicId);
      if (success) {
        message.success('删除成功');
        fetchImages(currentPage, searchQuery, selectedFolder);
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 批量删除图片
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的图片');
      return;
    }

    setBatchDeleting(true);
    try {
      const deletePromises = selectedRowKeys.map(publicId => deleteImgFromCloud(publicId));
      const results = await Promise.allSettled(deletePromises);
      
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failCount = selectedRowKeys.length - successCount;

      if (successCount > 0) {
        message.success(`成功删除 ${successCount} 个图片${failCount > 0 ? `，${failCount} 个删除失败` : ''}`);
        setSelectedRowKeys([]);
        fetchImages(currentPage, searchQuery, selectedFolder);
      } else {
        message.error('批量删除失败');
      }
    } catch (error) {
      message.error('批量删除失败');
      console.error(error);
    } finally {
      setBatchDeleting(false);
    }
  };

  // 复制链接
  const copyToClipboard = async (url: string, format: 'url' | 'markdown' | 'html' = 'url') => {
    let textToCopy = url;
    
    switch (format) {
      case 'markdown':
        textToCopy = `![图片](${url})`;
        break;
      case 'html':
        textToCopy = `<img src="${url}" alt="图片" />`;
        break;
      default:
        textToCopy = url;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      const formatNames = { url: 'URL', markdown: 'Markdown', html: 'HTML' };
      message.success(`${formatNames[format]} 格式已复制到剪贴板`);
    } catch {
      message.error('复制失败');
    }
  };

  // 更新图片元数据
  const handleUpdateImage = async () => {
    if (!editingImage) return;

    try {
      const tags = editTags ? editTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const response = await fetch('/api/cloudinary/update-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_id: editingImage.public_id,
          tags,
        }),
      });

      if (response.ok) {
        message.success('更新成功');
        setEditModalVisible(false);
        setEditingImage(null);
        setEditTags('');
        fetchImages(currentPage, searchQuery, selectedFolder);
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      message.error('更新失败');
      console.error(error);
    }
  };

  // 打开编辑模态框
  const openEditModal = (image: CloudinaryImage) => {
    setEditingImage(image);
    setEditTags(image.tags?.join(', ') || '');
    setEditModalVisible(true);
  };

  // 预览图片
  const openPreview = (image: CloudinaryImage) => {
    setPreviewImage(image);
    setPreviewModalVisible(true);
  };

  // 格式化文件大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取文件夹列表（从已有图片中提取）
  const folders = Array.from(new Set(
    images.map(img => img.folder).filter(Boolean)
  ));

  const columns = [
    {
      title: '预览',
      dataIndex: 'secure_url',
      key: 'preview',
      width: 100,
      render: (url: string, record: CloudinaryImage) => (
        <Image
          src={url}
          alt={record.public_id}
          width={60}
          height={60}
          style={{ objectFit: 'cover', cursor: 'pointer' }}
          preview={false}
          onClick={() => openPreview(record)}
        />
      ),
    },
    {
      title: '文件名',
      dataIndex: 'public_id',
      key: 'public_id',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text copyable={{ text }}>{text.split('/').pop()}</Text>
        </Tooltip>
      ),
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
      render: (format: string) => <Tag color="blue">{format.toUpperCase()}</Tag>,
    },
    {
      title: '尺寸',
      key: 'dimensions',
      width: 100,
      render: (record: CloudinaryImage) => (
        <Text>{record.width} × {record.height}</Text>
      ),
    },
    {
      title: '大小',
      dataIndex: 'bytes',
      key: 'bytes',
      width: 100,
      render: (bytes: number) => <Text>{formatBytes(bytes)}</Text>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map(tag => (
            <Tag key={tag} color="green">{tag}</Tag>
          )) || '-'}
        </Space>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => <Text>{formatDate(date)}</Text>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: CloudinaryImage) => (
        <Space>
         
          <Tooltip title="复制 URL">
            <Button
              type="text"
              icon={<Copy size={16} />}
              onClick={() => copyToClipboard(record.secure_url, 'url')}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<Download size={16} />}
              onClick={() => window.open(record.secure_url, '_blank')}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个图片吗？"
            onConfirm={() => handleDelete(record.public_id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.mediaManager}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总图片数"
              value={total}
              prefix={<ImageIcon size={20} />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前显示"
              value={images.length}
              prefix={<Eye size={20} />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="文件夹数"
              value={folders.length}
              prefix={<Cloud size={20} />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总大小"
              value={images.reduce((acc, img) => acc + img.bytes, 0)}
              formatter={(value) => formatBytes(Number(value))}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card className={styles.tableContainer}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>媒体库</Title>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 个图片吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<Trash2 size={18} />}
                  loading={batchDeleting}
                  size="large"
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
            <Button
              type="primary"
              icon={<UploadIcon size={18} />}
              onClick={() => setUploadModalVisible(true)}
              size="large"
            >
              上传图片
            </Button>
            <Button
              icon={<RotateCcw size={18} />}
              onClick={() => fetchImages(1, searchQuery, selectedFolder)}
              size="large"
            >
              刷新
            </Button>
          </Space>
        </div>

        <div className={styles.filterSection}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索图片..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
                size="large"
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="选择文件夹"
                allowClear
                style={{ width: '100%' }}
                value={selectedFolder}
                onChange={handleFolderChange}
                size="large"
              >
                {folders.map(folder => (
                  <Option key={folder} value={folder}>{folder}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={images}
          loading={loading}
          rowKey="public_id"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => setSelectedRowKeys(selectedRowKeys as string[]),
            getCheckboxProps: () => ({
              disabled: batchDeleting,
            }),
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurentPage(page);
              setPageSize(size);
              if (page > 1) {
                fetchImages(page, searchQuery, selectedFolder, false);
              } else {
                fetchImages(1, searchQuery, selectedFolder);
              }
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 上传模态框 */}
      <Modal
        title="上传图片"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setUploadModalVisible(false);
            setFileList([]);
          }}>
            取消
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploading}
            onClick={handleUpload}
            disabled={fileList.length === 0}
          >
            上传 {fileList.length > 0 && `(${fileList.length})`}
          </Button>,
        ]}
      >
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadIcon size={48} style={{ color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持单个或批量上传图片文件</p>
        </Upload.Dragger>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title="图片预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="copy" onClick={() => previewImage && copyToClipboard(previewImage.secure_url)}>
            复制链接
          </Button>,
          <Button key="download" onClick={() => previewImage && window.open(previewImage.secure_url, '_blank')}>
            下载
          </Button>,
        ]}
        width={800}
      >
        {previewImage && (
          <div>
            <Image
              src={previewImage.secure_url}
              alt={previewImage.public_id}
              style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
            />
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>文件名: </Text>
                  <Text copyable={{ text: previewImage.public_id }}>
                    {previewImage.public_id.split('/').pop()}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>格式: </Text>
                  <Tag color="blue">{previewImage.format.toUpperCase()}</Tag>
                </Col>
                <Col span={12}>
                  <Text strong>尺寸: </Text>
                  <Text>{previewImage.width} × {previewImage.height}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>大小: </Text>
                  <Text>{formatBytes(previewImage.bytes)}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>链接: </Text>
                  <Text copyable={{ text: previewImage.secure_url }} ellipsis>
                    {previewImage.secure_url}
                  </Text>
                </Col>
                {previewImage.tags && previewImage.tags.length > 0 && (
                  <Col span={24}>
                    <Text strong>标签: </Text>
                    <Space wrap>
                      {previewImage.tags.map(tag => (
                        <Tag key={tag} color="green">{tag}</Tag>
                      ))}
                    </Space>
                  </Col>
                )}
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑图片"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingImage(null);
          setEditTags('');
        }}
        onOk={handleUpdateImage}
        okText="保存"
        cancelText="取消"
      >
        {editingImage && (
          <div>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Image
                src={editingImage.secure_url}
                alt={editingImage.public_id}
                width={200}
                height={200}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <Text strong>文件名: </Text>
              <Text>{editingImage.public_id.split('/').pop()}</Text>
            </div>
            <div style={{ margin: '16px 0' }}>
              <Text strong>标签 (用逗号分隔): </Text>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="输入标签，用逗号分隔"
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaManager;
