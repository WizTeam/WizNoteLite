import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMore from '@material-ui/icons/ExpandMore';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';


const customIcon = require.context('./custom', false, /\.js$/);

const CommonIcons = {
  MoreHorizIcon,
  ArrowRightIcon: ChevronRightIcon,
  ArrowBottomIcon: ExpandMore,
  SelectedIcon: CheckIcon,
  ClearIcon,
  ArrowDropDownIcon,

  ...customIcon.keys().reduce((modules, path) => {
    // eslint-disable-next-line no-param-reassign
    modules[path.replace(/^\.\/(.*)\.js$/, '$1')] = customIcon(path).default;
    return modules;
  }, {}),

};

export default CommonIcons;
