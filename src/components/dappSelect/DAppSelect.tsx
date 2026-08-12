import { Select } from 'antd';
import { DAppOption } from './DAppOption';
import { useDAppSearch } from './hooks/useDAppSearch';

const { Option } = Select;

export interface DAppSelectProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function DAppSelect({
  value,
  onChange,
  placeholder = "请选择关联 DApp",
  allowClear = true,
  disabled = false,
  loading = false,
  className,
}: DAppSelectProps) {
  const {
    dappList,
    dappLoading,
    dappSearchKeyword,
    handleDappSearch,
  } = useDAppSearch();

  return (
    <Select
      value={value}
      onChange={onChange}
      allowClear={allowClear}
      showSearch={{
        filterOption: false,
        onSearch: handleDappSearch,
      }}
      placeholder={placeholder}
      notFoundContent={
        dappLoading
          ? '加载中...'
          : dappSearchKeyword
            ? `未找到包含"${dappSearchKeyword}"的DApp`
            : '暂无数据'
      }
      loading={dappLoading || loading}
      disabled={disabled}
      defaultActiveFirstOption={false}
      optionLabelProp="label"
      styles={{ popup: { root: { maxHeight: '300px' } } }}
      className={className}
    >
      {dappList.map((dapp) => (
        <Option key={dapp.ID} value={dapp.ID} label={dapp.name}>
          <DAppOption dapp={dapp} />
        </Option>
      ))}
    </Select>
  );
}
