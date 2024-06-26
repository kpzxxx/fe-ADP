import UpdateWord from '@/pages/WordBook/components/UpdateWord';
import { deleteWord, getWords, saveWord, searchWord } from '@/services/ant-design-pro/api';
import { CloseCircleTwoTone, EditTwoTone, PlusCircleTwoTone, SaveTwoTone } from '@ant-design/icons';
import { ModalForm, PageContainer, ProFormText } from '@ant-design/pro-components';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  message,
  Pagination,
  Progress,
  Row,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';
import './index.less';

const { Search } = Input;
const App: React.FC = () => {
  const [tagData, setTagData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [wordTotal, setWordTotal] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [deleteWords, setDeleteWords] = useState('');
  const [visible, setVisible] = useState<boolean>(false);
  const [updateOpen, setUpdateOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [messageApi] = message.useMessage();
  const colors = [
    'magenta',
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'geekblue',
    'purple',
  ];
  const [currentRow, setCurrentRow] = useState<WordBook.AddWord>();
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const warning = (msg: string) => message.warning(msg);
  const success = (msg: string) => message.success(msg);
  const getData = async (p?: number, ps?: number) => {
    const result = await getWords({
      params: { current: p ? p : current, pageSize: ps ? ps : pageSize },
    });
    let _tagData = result?.data?.date;
    setTagData(_tagData);
    setTotal(result?.data?.total);
    setWordTotal(result?.data?.wordTotal);
    return result;
  };

  useEffect(() => {
    getData().then();
  }, []);

  const onChange = (page: number, pageSize: number) => {
    setCurrent(page);
    setPageSize(pageSize);
  };

  const handleAdd = async (word: WordBook.AddWord) => {
    try {
      let result = await saveWord(JSON.stringify(word));
      console.log(result);
      if (result?.data?.word) {
        warning(result.data.meaning + ', ' + result.data.date);
      } else {
        success('Save successfully');
      }
      messageApi.loading('saving...');
      return true;
    } catch (error) {
      messageApi.error('Save failed, please try again!');
      return false;
    }
  };

  const handleDelete = () => {
    if (deleteWords !== '') {
      deleteWord(deleteWords).then(() => getData());
    }

    setEditing(false);
    setDeleteWords('');
  };

  const handleClose = (word: string) => {
    setDeleteWords(deleteWords === '' ? word : deleteWords.concat(',').concat(word));
  };

  const findWord = async (value: string) => {
    if (!value) {
      getData();
      return;
    }
    const data = await searchWord(value);
    if (data.data) {
      let _tagData: any[] = [];
      _tagData.push({ date: data.data.date, words: [{ word: value, meaning: data.data.meaning }] });
      setTagData(_tagData);
      setTotal(1);
    }

    message.warning(
      data.data ? data.data.meaning + ' (' + data.data.date + ')' : 'Oops, no result!😭',
    );
  };

  return (
    <PageContainer>
      <Row>
        <Col span={12}>
          <Progress
            status="active"
            percent={wordTotal / 50}
            size={[500, 20]}
            strokeColor="#1890ff"
            style={{ paddingTop: '4px' }}
            format={(percent) => `${(percent ? percent * 50 : 0).toFixed(0)}/5000`}
          />
        </Col>
        <Col span={5} offset={1} style={{ textAlign: 'right' }}>
          <Search placeholder="search" onSearch={(value) => findWord(value)} allowClear={true} />
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          {!editing && (
            <Button type={'primary'} onClick={() => setVisible(true)}>
              <PlusCircleTwoTone />
              Add
            </Button>
          )}

          {!editing && (
            <Button
              onClick={() => {
                setEditing(true);
                form.resetFields();
              }}
            >
              <EditTwoTone />
              Edit
            </Button>
          )}
          {editing && (
            <Button onClick={() => handleDelete()} type={'primary'}>
              <SaveTwoTone />
              Save
            </Button>
          )}
          {editing && (
            <Button onClick={() => setEditing(false)}>
              <CloseCircleTwoTone />
              Cancel
            </Button>
          )}
        </Col>
      </Row>
      {tagData &&
        tagData.map((data: WordBook.Words, index) => {
          let color = colors[index % colors.length];
          return (
            <div key={data.date}>
              <div>
                <Divider orientation="left" dashed>
                  {data.date} ({data.words.length})
                </Divider>
                <Row>
                  {data.words.map((value: WordBook.Word) => {
                    return (
                      <Tooltip
                        title={value.meaning ? value.meaning : value.word}
                        key={value.id}
                        mouseLeaveDelay={1}
                      >
                        <Tag
                          color={color}
                          className={'larger-font'}
                          closable={editing}
                          onClose={() => handleClose(value.word)}
                          onClick={() => {
                            setUpdateOpen(true);
                            setCurrentRow(value);
                          }}
                        >
                          {value.word}
                        </Tag>
                      </Tooltip>
                    );
                  })}
                </Row>
              </div>
            </div>
          );
        })}
      <Row justify={'end'}>
        <Pagination
          current={current}
          pageSize={pageSize}
          onChange={(page, pageSize) =>
            getData(page, pageSize).then(() => onChange(page, pageSize))
          }
          total={total}
        ></Pagination>
      </Row>
      <ModalForm
        title="New word"
        width="400px"
        form={form}
        open={visible}
        modalProps={{ closeIcon: false }}
        autoFocusFirstInput={true}
        onOpenChange={setVisible}
        onFinish={async (value) => {
          const success = await handleAdd(value as WordBook.AddWord);

          if (success) {
            setVisible(false);
            await getData();
            form.resetFields();
          }
        }}
        isKeyPressSubmit={true}
      >
        <ProFormText
          rules={[
            {
              required: true,
              message: 'Word is required',
            },
          ]}
          width="md"
          name="word"
          label={'Word'}
          initialValue={''}
        />
      </ModalForm>
      <UpdateWord
        word={currentRow || {}}
        updateModalOpen={updateOpen}
        onCancel={setUpdateOpen}
        onSubmit={(value) => {
          let promise = handleAdd(value as WordBook.AddWord);
          setCurrentRow(undefined);
          setUpdateOpen(false);
          promise.then(() => getData());
          return promise;
        }}
      />
    </PageContainer>
  );
};

export default App;
