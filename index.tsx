import React, { useRef, useState } from 'react'
import {DndProvider, DropTargetMonitor, useDrag, useDrop, XYCoord} from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './index.less'
const List = [
  {
    id:1,
    name: '拖拽1',
  },
  {
    id:2,
    name: '拖拽2',
  },
  {
    id:3,
    name: '拖拽3',
  },
  {
    id:4,
    name: '拖拽4',
  },
  {
    id:5,
    name: '拖拽5',
  },
]
/**
 * 通用拖拽排序的容器
 * @param row 当前行
 * @param onItemDragClass 拖拽过程的样式 top | bottom
 * @param onSortItemChange 拖拽结束后返回的值 dragRow 当前拖拽 placeRow 放置的，posi 位置 top | bottom
 * @param keyName 键名
 */
type IProps = {
  row: any,
  onItemDragClass: (key:number,value:string) => void,
  onSortItemChange: (dragRow: any, placeRow: any, posi: string) => void // 排序后
  keyName: string
}
const DragSortItemComponent:React.FC<IProps> = props => {
  const { row,onItemDragClass,onSortItemChange,keyName } = props
  const ref = useRef<HTMLDivElement>(null)
  /**
   * 拖拽容器
   */
  const [, drop] = useDrop({
    // 定义拖拽的类型 类型必须相同
    accept: 'sort',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop()
      if (didDrop) {
        return
      }
    },
    canDrop: (item, mointor) => {
      // 阻止默认拖拽释放，如果放在空白区域取消，最后一个class
      onItemDragClass(row[keyName], '')
      return false
    },
    hover: (item: any, monitor) => {
      const didHover = monitor.isOver({ shallow: true })
      if (didHover) {
        // 拖拽目标的id
        const dragIndex = item[keyName]
        // 放置目标id  可以用index | id 只要是number，数据里唯一的就可以
        const hoverIndex = row[keyName]
        // 如果一样不处理
        if (dragIndex === hoverIndex) {
          onItemDragClass(row[keyName], '')
          return
        }
        // 获取放置的位置
        const hoverBoundingRect = ref.current?.getBoundingClientRect() as DOMRect
        // 获取放置的Y轴中点
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
        // 获取拖拽目标偏移量
        const clientOffset = monitor.getClientOffset() as XYCoord
        const hoverClientY = clientOffset.y - hoverBoundingRect.top
        if (dragIndex !== hoverIndex) {
          if (hoverMiddleY < hoverClientY) {
            onItemDragClass(row[keyName], 'bottom')
          } else {
            onItemDragClass(row[keyName], 'top')
          }
          // 如果不做成通用拖拽容器，把参数存起来，把这行放在useDrag的end方法里,
          onSortItemChange(item, row, hoverMiddleY < hoverClientY ? 'bottom' : 'top')
        }
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })
  /**
   * 定义拖拽
   * isDragging 是否拖拽
   */
  const [{ isDragging }, drag] = useDrag({
    item: { ...row, type: 'sort'},
    end: () => {
      // onSortItemChange(item, row, hoverMiddleY < hoverClientY ? 'bottom' : 'top')
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
      didDrop: monitor.isDragging(),
    }),
  })
  drop(drag(ref))
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0 : 1 }}>
      {props.children}
    </div>
  )
}
/**
 * 内容组件
 * @param props
 */
const DragSortComponent:React.FC<{}> = props => {
  const [list,setList] = useState<{id:number,name:string}[]>(List)
  const [itemClass, setItemClass] = useState<{ key: number | null; value: string }>({
    key: null,
    value: '',
  })
  // 拖拽后的值
  const sortItems = useRef<{ dragRow: any; placeRow: any; posi: string }>({
    dragRow: {},
    placeRow: {},
    posi: '',
  })
  // 拖拽结束后的方法
  const onDrop = (item: any, monitor: DropTargetMonitor) => {
    const { dragRow, placeRow, posi } = sortItems.current
    let _map: any[] = JSON.parse(JSON.stringify(list))
    let index1 = _map.findIndex(v => v.id === dragRow.id) // 拖拽的itemIndex
    _map.splice(index1, 1) // 先删掉拖拽的，在获取放置的
    let index = _map.findIndex(v => v.id === placeRow.id) // 放置的itemIndex
    if (index !== -1 && index1 !== -1) {
      _map.splice(posi === 'bottom' ? index + 1 : index, 0, dragRow)
      setList(() => _map)
    }
  }
  // DragSortItemComponent组件是通用排序组件，所以需要在父组件在定义一个useDrop,来改变数据 必须挂载在父级div
  const [, drop] = useDrop({
    accept: 'sort', // 必须和拖拽的accept一致
    drop: onDrop,
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })
  const onItemDragClass = (key:number,value:string) => {
    if (itemClass.value !== value) {
      setItemClass(() => {
        let data = { key, value }
        return data
      })
    }
  }
  const onSortItemChange = (dragRow: any, placeRow: any, posi: string) => {
    sortItems.current = { dragRow, placeRow, posi }
  }
  return (
    <div className="drag-sort-component-wrapper" ref={drop}>
      {
        list.map(v => (
          <DragSortItemComponent
            key={v.id}
            row={v}
            onItemDragClass={onItemDragClass}
            onSortItemChange={onSortItemChange}
            keyName="id"
          >
            <div className={['drag-item ',itemClass.key === v.id ? itemClass.value : ''].join(' ')}>{v.name}</div>
          </DragSortItemComponent>
        ))
      }
    </div>
  )
}

const Drag:React.FC<{}> = props => {
  return (
    <div className="drag-wrapper">
      {/* DndProvider组件提供了react-dnd的功能，必须通过backend绑定HTML5Backend*/}
      <DndProvider backend={HTML5Backend}>
        <DragSortComponent/>
      </DndProvider>
    </div>
  )
}

export default Drag