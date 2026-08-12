import type React from "react"
import { Button, Card, Avatar, Tag, Spin, message, Modal, Input, Form, Upload, Popconfirm } from "antd"
import {
  MapPin, Users, Globe, Building2, Mail, Calendar,
  ArrowLeft, UserPlus, Star,
  Clock, MapPin as MapIcon, User, Link as LinkIcon,
  Upload as UploadIcon,
  Edit,
  Trash2
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/router"
import styles from "./index.module.css"
import { getCommunity, Community } from "../../api/comunity"
import AvatarEdit from "@/components/settings/AvatarEdit"
import { createMember, deleteMember, updateMember } from "@/pages/api/member"
import { useAuth } from "@/contexts/AuthContext"

// 根据接口返回的数据结构定义接口
interface Event {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  title: string;
  description: string;
  event_mode: string;
  event_type: string;
  location: string;
  link: string;
  start_time: string;
  end_time: string;
  cover_img: string;
  tags: string[];
  participants: number;
  status: number;
  publish_status: number;
  publish_time: string | null;
}

interface CommunityMember {
  ID?: number;
  name?: string;
  avatar?: string;
  title?: string;
}

// 扩展社区详情接口
interface CommunityDetail extends Community {
  events?: Event[];
  members?: CommunityMember[];
  user_id?: number;
  user?: any;
  isInternational?: boolean;
}

// 添加成员的表单数据接口
interface AddMemberFormData {
  name: string;
  title: string;
  avatar?: string;
}

const CommunityDetailPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [avatar, setAvatar] = useState<string>("")
  const [editingMember, setEditingMember] = useState<CommunityMember | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();


   const { session, status } = useAuth();
  
    const permissions = useMemo(() => session?.user?.permissions || [], [session?.user?.permissions]);

  // 获取社区详情数据
  useEffect(() => {
    if (!id) return

    const loadCommunityDetail = async () => {
      try {
        setLoading(true)

        const result = await getCommunity(Number(id))

        if (result.success && result.data) {
          // 直接使用接口返回的数据
          const communityData: CommunityDetail = {
            ...result.data,
            isInternational: isInternationalCity(result.data.city),
          }

          setCommunity(communityData)
          console.log('社区详情数据:', communityData)
        } else {
          console.error('获取社区详情失败:', result.message)
          message.error(result.message || '获取社区详情失败')
          setCommunity(null)
        }
      } catch (error) {
        console.error('加载社区详情失败:', error)
        message.error('加载社区详情失败')
        setCommunity(null)
      } finally {
        setLoading(false)
      }
    }

    loadCommunityDetail()
  }, [id])

  // 判断是否为国际城市
  const isInternationalCity = (cityName: string): boolean => {
    const internationalCities = ['新加坡', '东京', '首尔', '纽约', '旧金山', '伦敦', '柏林', '悉尼'];
    return internationalCities.includes(cityName);
  }

  // 格式化日期时间
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 获取活动状态
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      return { status: 'upcoming', text: '即将开始', color: 'blue' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', text: '进行中', color: 'green' };
    } else {
      return { status: 'completed', text: '已结束', color: 'default' };
    }
  }

  const handleBack = () => {
    router.back()
  }


  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.ID}`)
  }

  const handleCreateEvent = () => {
    router.push(`/events/new?event_type=community&community_id=${id}`)
  }

  // 打开添加成员弹窗
  const handleOpenAddMember = () => {
    setAddMemberModalVisible(true)
  }

  // 关闭添加成员弹窗
  const handleCloseAddMember = () => {
    setAddMemberModalVisible(false)
    setAvatar("")
    form.resetFields()
  }

  // 提交添加成员表单
  const handleAddMember = async (values: AddMemberFormData) => {
    try {
      if (!community) {
        message.error('社区信息不存在');
        return;
      }

      // 调用添加成员的API
      const result = await createMember({
        name: values.name,
        avatar: avatar,
        title: values.title,
        community_id: community.ID
      });

      if (result.success && result.data) {
        // 更新社区数据，添加新成员
        if (community) {
          const newMember: CommunityMember = {
            ID: result.data.ID,
            name: result.data.name,
            avatar: result.data.avatar,
            title: result.data.title
          };

          const updatedCommunity = {
            ...community,
            members: [...(community.members || []), newMember]
          };
          setCommunity(updatedCommunity);
        }

        message.success('成员添加成功');
        handleCloseAddMember();
      } else {
        message.error(result.message || '添加成员失败');
      }
    } catch (error) {
      message.error('添加成员失败');
      console.error('添加成员失败:', error);
    }

    setAvatar("");
    form.resetFields();
  };

  const handleAvatarSave = async (avatarUrl: string) => {
    // 设置表单中的头像字段
    form.setFieldsValue({ avatar: avatarUrl });
    setAvatar(avatarUrl);
    message.success('头像上传成功');
  }


  const handleDeleteMember = async (member: CommunityMember) => {
    try {
      if (member.ID) {
        // 调用删除API
        const result = await deleteMember(member.ID);


        if (result.success) {
          // 从列表中移除
          if (community) {
            const updatedMembers = community.members?.filter(m => m.ID !== member.ID) || [];
            setCommunity({
              ...community,
              members: updatedMembers
            });
          }
          message.success('成员删除成功');
        } else {
          message.error(result.message || '删除成员失败');
        }
      } else {
        message.error('成员ID不存在');
      }
    } catch (error) {
      message.error('删除成员失败');
      console.error('删除成员失败:', error);
    }
  };

  // 打开编辑弹窗
  const handleEditMember = (member: CommunityMember) => {
    setEditingMember(member);
    editForm.setFieldsValue({
      name: member.name,
      title: member.title,
      avatar: member.avatar
    });
    setEditModalVisible(true);
  };

  // 关闭编辑弹窗
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingMember(null);
    setAvatar("")
    editForm.resetFields();
  };


  // 提交编辑表单
  const handleEditMemberSubmit = async (values: AddMemberFormData) => {
    try {
      if (!editingMember?.ID) {
        message.error('成员信息不完整');
        return;
      }

      // 调用更新成员API
      const result = await updateMember(editingMember.ID, {
        name: values.name,
        title: values.title,
        avatar: values.avatar
      });

      if (result.success && result.data) {
        // 更新本地数据
        if (community) {
          const updatedMembers = community.members?.map(member =>
            member.ID === editingMember.ID
              ? { ...member, ...result.data }
              : member
          ) || [];

          setCommunity({
            ...community,
            members: updatedMembers
          });
        }

        message.success('成员信息更新成功');
        handleCloseEditModal();
      } else {
        message.error(result.message || '更新成员信息失败');
      }
    } catch (error) {
      message.error('更新成员信息失败');
      console.error('更新成员信息失败:', error);
    }
  };


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <div className={styles.loadingText}>加载社区详情中...</div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className={styles.errorContainer}>
        <h3>社区信息不存在</h3>
        <Button onClick={handleBack}>返回</Button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeft size={16} />}
        onClick={handleBack}
        className={styles.backButton}
      >
        返回社区列表
      </Button>

      {/* 社区头部信息 */}
      <div className={styles.header}>
        <div className={styles.headerBackground}>
          {community.cover && (
            <img src={community.cover} alt={community.city} className={styles.coverImage} />
          )}
          <div className={styles.headerOverlay}></div>
        </div>
        <div className={styles.headerContent}>
          <div className={styles.communityInfo}>
            <div className={styles.communityTitle}>
              <h1 className={styles.cityName}>
                <MapPin size={24} />
                {community.city}开源社区
                {community.isInternational && <Globe size={20} className={styles.internationalIcon} />}
              </h1>
            </div>


            {/* 社区统计 */}
            <div className={styles.statsContainer}>
              <div className={styles.stat}>

                <span className={styles.statNumber}>{community.members?.length || 0}</span>
                <span className={styles.statLabel}>成员</span>
              </div>
              <div className={styles.stat}>

                <span className={styles.statNumber}>0</span>
                <span className={styles.statLabel}>项目</span>
              </div>
              <div className={styles.stat}>

                <span className={styles.statNumber}>{community.events?.length || 0}</span>
                <span className={styles.statLabel}>活动</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社区内容区域 */}
      <div className={styles.content}>

        {/* 社区成员列表 */}
        <div className={styles.membersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Users size={24} />
              社区成员 ({community.members?.length || 0})
            </h2>
            {status === 'authenticated' && permissions.includes('event:write') && (
              <Button
                type="primary"
                size="large"
                icon={<UserPlus size={18} />}
                onClick={handleOpenAddMember}
                className={styles.joinButton}
              >
                添加成员
              </Button>
            )}
          </div>

          {community.members && community.members.length > 0 ? (
            <div className={styles.membersGrid}>
              {community.members.map((member) => (
                <Card
                  key={member.ID}
                  className={styles.memberCard}
                  extra={
                     status === 'authenticated' && permissions.includes('event:write') && (
                    <div className={styles.cardActions}>
                      <Button
                        type="text"
                        icon={<Edit size={16} />}
                        onClick={() => handleEditMember(member)}
                        className={styles.actionButton}
                      />
                      <Popconfirm
                        title="删除成员"
                        description={
                          <div>
                            <div>确定要删除成员 <strong>{member.name}</strong> 吗？</div>
                            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                              此操作不可撤销
                            </div>
                          </div>
                        }
                        onConfirm={() => handleDeleteMember(member)}
                        okText="确认删除"
                        cancelText="取消"
                        okType="danger"
                        placement="topRight"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 size={16} />}
                          className={styles.actionButton}
                        />
                      </Popconfirm>
                    </div>)
                  }
                >
                  <div className={styles.memberHeader}>
                    <Avatar size={64} src={member.avatar} className={styles.memberAvatar}>
                      {member.name?.[0]}
                    </Avatar>
                    <div className={styles.memberInfo}>
                      <h3 className={styles.memberName}>{member.name || '匿名用户'}</h3>
                      <Tag color="blue" className={styles.roleTag}>{member.title || '社区成员'}</Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Users size={48} />
              <h3>暂无成员数据</h3>
              <p>该社区目前还没有成员信息</p>
            </div>
          )}
        </div>

        {/* 社区活动列表 */}
        <div className={styles.eventsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={24} />
              社区活动 ({community.events?.length || 0})
            </h2>
             {status === 'authenticated' && permissions.includes('event:write') && (
            <Button
              type="primary"
              size="large"
              onClick={handleCreateEvent}
            >
              创建活动
            </Button>
             )}
          </div>

          {community.events && community.events.length > 0 ? (
            <div className={styles.eventsGrid}>
              {community.events.map((event) => {
                const eventStatus = getEventStatus(event);
                return (
                  <Card
                    key={event.ID}
                    className={styles.eventCard}
                    cover={
                      event.cover_img ? (
                        <img
                          alt={event.title}
                          src={event.cover_img}
                          className={styles.eventCover}
                        />
                      ) : null
                    }
                    actions={[
                      <Button
                        type="link"
                        onClick={() => handleEventClick(event)}
                        key="view"
                      >
                        查看详情
                      </Button>,
                    ]}
                  >
                    <div className={styles.eventContent}>
                      <div className={styles.eventHeader}>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <Tag color={eventStatus.color}>
                          {eventStatus.text}
                        </Tag>
                      </div>

                      <p className={styles.eventDescription}>{event.description}</p>

                      <div className={styles.eventDetails}>
                        <div className={styles.eventDetail}>
                          <Clock size={14} />
                          <span>{formatDateTime(event.start_time)}</span>
                        </div>
                        <div className={styles.eventDetail}>
                          <MapIcon size={14} />
                          <span>{event.location} · {event.event_mode}</span>
                        </div>
                        {event.link && (
                          <div className={styles.eventDetail}>
                            <LinkIcon size={14} />
                            <a href={event.link} target="_blank" rel="noopener noreferrer">
                              活动链接
                            </a>
                          </div>
                        )}
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className={styles.eventTags}>
                          {event.tags.map((tag, index) => (
                            <Tag key={index} className={styles.eventTag}>
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Calendar size={48} />
              <h3>暂无活动数据</h3>
              <p>该社区目前还没有活动信息</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加成员弹窗 */}
      <Modal
        title="添加社区成员"
        open={addMemberModalVisible}
        onCancel={handleCloseAddMember}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMember}
          className={styles.addMemberForm}
        >
          <Form.Item
            name="avatar"
            label="头像"
            rules={[{ required: true, message: '请输入成员头像' }]}
          >
            <AvatarEdit
              currentAvatar={avatar}
              onSave={handleAvatarSave}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="成员姓名"
            rules={[{ required: true, message: '请输入成员姓名' }]}
          >
            <Input placeholder="请输入成员姓名" />
          </Form.Item>

          <Form.Item
            name="title"
            label="职位/头衔"
            rules={[{ required: true, message: '请输入职位或头衔' }]}
          >
            <Input placeholder="例如：社区管理员、技术专家等" />
          </Form.Item>

          <Form.Item className={styles.formActions}>
            <Button onClick={handleCloseAddMember}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              添加成员
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="编辑成员信息"
        open={editModalVisible}
        onCancel={handleCloseEditModal}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditMemberSubmit}
          className={styles.editMemberForm}
        >
          <Form.Item
            name="avatar"
            label="头像"
          >
            <Form.Item
              name="avatar"
              label="头像"
              rules={[{ required: true, message: '请输入成员头像' }]}
            >
              <AvatarEdit
                currentAvatar={editingMember?.avatar}
                onSave={handleAvatarSave}
              />
            </Form.Item>
          </Form.Item>

          <Form.Item
            name="name"
            label="成员姓名"
            rules={[{ required: true, message: '请输入成员姓名' }]}
          >
            <Input placeholder="请输入成员姓名" />
          </Form.Item>

          <Form.Item
            name="title"
            label="职位/头衔"
            rules={[{ required: true, message: '请输入职位或头衔' }]}
          >
            <Input placeholder="例如：社区管理员、技术专家等" />
          </Form.Item>

          <Form.Item className={styles.formActions}>
            <Button onClick={handleCloseEditModal}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CommunityDetailPage
