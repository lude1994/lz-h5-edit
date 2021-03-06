import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  POINT_LEFT_CENTER, POINT_RIGHT_CENTER, POINT_TOP_CENTER, POINT_BOTTOM_CENTER,
  POINT_LEFT_TOP, POINT_RIGHT_TOP, POINT_LEFT_BOTTOM, POINT_RIGHT_BOTTOM, POINT_ROTATE,
  ALL_ITEM,
  ITEM_TYPE_GROUP,
} from '@lzshow/constants';
import { startMove } from '../../store/action';

class Phone extends React.Component {
    static propTypes = {
      dispatch: PropTypes.func.isRequired,
      editList: PropTypes.object.isRequired,
      groupList: PropTypes.object.isRequired,
      activeEditKey: PropTypes.array.isRequired,
    }

    constructor(props) {
      super(props);
      this.state = {};
    }

    onScale = (flag, uniqueId, group = false) => (e) => {
      const {
        dispatch, activeEditKey, editList, groupList,
      } = this.props;
      // if (activeEditKey.length === 0) {
      //   e.preventDefault();
      //   dispatch(changeActiveEditKey(uniqueId));
      //   return;
      // }
      const elem = e.target;
      const key = elem.getAttribute('data-key');
      // const rect = {};
      const rectMap = {};

      const groupKeys = {};
      activeEditKey.forEach((it) => {
        const item = editList[it];
        const { rect, belong, nodeType } = item;
        if (nodeType === ITEM_TYPE_GROUP) {
          groupKeys[it] = Object.assign({}, rect);
        } else if (belong) {
          groupKeys[belong] = Object.assign({}, editList[belong].rect);
        } else {
          rectMap[it] = Object.assign({}, rect);
        }
      });

      Object.keys(groupKeys).forEach((k) => {
        const groupItem = editList[k];
        const itemList = groupList[k];
        itemList.forEach((itemKey) => {
          const item = editList[itemKey];
          const { rect } = item;
          rectMap[itemKey] = Object.assign({}, rect, { top: groupItem.rect.top + rect.top, left: groupItem.rect.left + rect.left });
        });
      });

      if (key) {
        const obj = { key, rectMap };
        if (key === POINT_ROTATE) {
          obj.boundRect = e.currentTarget.getBoundingClientRect();
          // dispatch(saveMoveTagBoundingClientRect(e.currentTarget.getBoundingClientRect()));
        }
        dispatch(startMove(obj));
      } else {
        dispatch(startMove({ key: flag, rectMap }));
      }
    }

    getGroupRect(group) {
      const { editList } = this.props;
      const rect = {};
      let left = 0;
      let top = 0;
      let width = 0;
      let height = 0;
      group.forEach((uniqueId, index) => {
        const item = editList[uniqueId];
        const itemRect = item.rect;
        if (index === 0) {
          /* eslint-disable-next-line prefer-destructuring */
          left = itemRect.left;
          /* eslint-disable-next-line prefer-destructuring */
          top = itemRect.top;
          /* eslint-disable-next-line prefer-destructuring */
          width = itemRect.width + left;
          /* eslint-disable-next-line prefer-destructuring */
          height = itemRect.height + top;
        } else {
          left = Math.min(left, itemRect.left);
          top = Math.min(top, itemRect.top);
          width = Math.max(width + left, itemRect.width + itemRect.left);
          height = Math.max(height + top, itemRect.height + itemRect.top);
        }
      });
      rect.left = left;
      rect.top = top;
      rect.width = width - left;
      rect.height = height - top;
      return rect;
    }

    renderLine(it) {
      const {
        uniqueId, data, group, type,
        origin = {},
      } = it;
      const { rect } = data;
      const {
        top,
        left,
        width,
        height,
        rotate,
      } = rect;
      return (
        <ul
          className="ctrl-container"
          key={uniqueId}
          onMouseDown={this.onScale(ALL_ITEM, uniqueId, group)}
          style={{
            position: 'absolute',
            width,
            left,
            top,
            height,
            transform: `rotate(${rotate}deg)`,
            transformOrigin: `${origin.x}px ${origin.y}px`,
          }}
        >
          <li className="line t">
            <span
              className="point tc"
              data-key={POINT_TOP_CENTER}
            />
          </li>
          <li className="line b">
            <span
              className="point bc"
              data-key={POINT_BOTTOM_CENTER}
            />
          </li>
          <li className="line l">
            <span
              className="point lc"
              data-key={POINT_LEFT_CENTER}
            />
            <span
              className="point lt"
              data-key={POINT_LEFT_TOP}
            />
            <span
              className="point lb"
              data-key={POINT_LEFT_BOTTOM}
            />
          </li>
          <li className="line r">
            <span
              className="point rc"
              data-key={POINT_RIGHT_CENTER}
            />
            <span
              className="point rt"
              data-key={POINT_RIGHT_TOP}
            />
            <span
              className="point rb"
              data-key={POINT_RIGHT_BOTTOM}
            />
          </li>
          <li className="line link-rotate" />
          <li
            className="point rotate"
            data-key={POINT_ROTATE}
          />
        </ul>
      );
    }

    render() {
      const { editList, groupList, activeEditKey } = this.props;
      const items = [];
      const belongs = {};
      activeEditKey.forEach((it) => {
        const group = groupList[it];
        if (group) {
          items.push({
            uniqueId: it,
            data: editList[it],
          });
        } else {
          const { rect, belong } = editList[it];
          const rectData = Object.assign({}, rect);
          const obj = {};
          // 当前为组内元素
          if (belong) {
            // const { rect: groupRect } = editList[belong];
            // rectData.left += groupRect.left;
            // rectData.top += groupRect.top;
            // rectData.rotate += groupRect.rotate;
            if (!belongs[belong]) {
              belongs[belong] = [];
              items.push({
                uniqueId: belong,
                data: editList[belong],
                type: 'no-event',
              });
            }
            belongs[belong].push({
              uniqueId: it,
              data: editList[it],
            });
          } else {
            items.push({
              uniqueId: it,
              data: editList[it],
            });
          }
        }
      });
      items.forEach((it) => {
        const item = belongs[it.uniqueId];
        if (item) {
          it.children = item;
        }
      });
      return (
        <div className="home-control-container">
          {
            items.map((it) => {
              const {
                uniqueId, data, group, type, children = [],
              } = it;
              const { rect } = data;
              const {
                top,
                left,
                width,
                height,
                rotate,
              } = rect;
              if (type === 'no-event') {
                return (
                  <ul
                    className="ctrl-container"
                    key={uniqueId}
                    onMouseDown={this.onScale(ALL_ITEM, uniqueId, group)}
                    style={{
                      position: 'absolute',
                      width,
                      left,
                      top,
                      height,
                      transform: `rotate(${rotate}deg)`,
                    }}
                  >
                    <li className="line t" />
                    <li className="line b" />
                    <li className="line l" />
                    <li className="line r" />
                    {
                      children.map(that => this.renderLine(that))
                    }
                  </ul>
                );
              }
              return this.renderLine(it);
            })
        }
        </div>
      );
    }
}

const mapStateToProps = (store) => {
  const state = store.toJS();
  const {
    editList, groupList, activeEditKey,
  } = state;
  const result = {
    editList, groupList, activeEditKey,
  };
  return result;
};

const mapDispatchToProps = dispatch => ({ dispatch });
export default connect(mapStateToProps, mapDispatchToProps)(Phone);
