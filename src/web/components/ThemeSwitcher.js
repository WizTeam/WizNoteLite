import React from 'react';
import PropTypes from 'prop-types';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import queryString from 'query-string';
import { overwriteEditorConfig } from '../utils/utils';

export default function ThemeSwitcher(props) {
  //
  const { color } = props;
  const params = queryString.parse(window.location.search);
  //
  let prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  if (params.theme) {
    prefersDarkMode = params.theme === 'dark';
    //
    if (prefersDarkMode) {
      window.document.body.style.backgroundColor = '#101115';
      window.document.body.style.color = 'white';
    } else {
      window.document.body.style.backgroundColor = 'white';
      window.document.body.style.color = '#333333';
    }
  }

  const getColorTheme = (darkMode = prefersDarkMode) => (
    {
      default: {
        sideDrawer: darkMode ? '#121212' : '#333333',
        sidebarItemHover: darkMode ? '#232323' : '#2a2a2a',
        noteList: darkMode ? '#2a2a2a' : 'rgb(245, 245, 245)',
        noteListActive: darkMode ? '#333333' : '#fff',
        content: darkMode ? '#333333' : '#fff',
        noteDate: darkMode ? '#555555' : '#aaaaaa',
        noteTitle: darkMode ? '#d8d8d8' : '#333333',
        noteTypeButton: darkMode ? '#d8d8d8' : '#333333',
        about: darkMode ? '#2a2a2a' : '#ffffff',
        hr: darkMode ? '#404040' : '#d8d8d8',
        MuiCheckColor: '#35e714',
      },
      beiges: {
        sideDrawer: darkMode ? '#322b27' : '#3f332b',
        sidebarItemHover: '#56504c',
        noteList: darkMode ? '#57544e' : '#f8efd2',
        noteListActive: darkMode ? '#6d6b65' : '#fff9e2',
        content: darkMode ? '#6d6b65' : '#fff9e2',
        noteDate: darkMode ? '#98948d' : '#aaaaaa',
        noteTitle: darkMode ? '#f8efd2' : '#333333',
        noteTypeButton: darkMode ? '#f8efd2' : '#333333',
        about: darkMode ? '#57544e' : '#fff9e2',
        hr: darkMode ? '#6D6B65' : '#d8d8d8',
        MuiCheckColor: '#35e714',
      },
      mintGreen: {
        sideDrawer: darkMode ? '#1f3134' : '#3a605d',
        sidebarItemHover: '#000000',
        noteList: darkMode ? '#364e4c' : '#bccecb',
        noteListActive: darkMode ? '#5b6b6a' : '#eae9e5',
        content: darkMode ? '#5b6b6a' : '#eae9e5',
        noteDate: darkMode ? '#889794' : '#969696',
        noteTitle: darkMode ? '#bccecb' : '#000000',
        noteTypeButton: darkMode ? '#bccecb' : '#000000',
        about: darkMode ? '#364e4c' : '#eae9e5',
        hr: darkMode ? '#1f3134' : '#aaaaaa',
        MuiCheckColor: '#21cdc0',
      },
      coffee: {
        sideDrawer: darkMode ? '#1b1b1b' : '#333333',
        sidebarItemHover: '#84614d',
        noteList: darkMode ? '#333333' : '#f4f4f4',
        noteListActive: darkMode ? '#494949' : '#ffffff',
        content: darkMode ? '#494949' : '#ffffff',
        noteDate: '#969696',
        noteTitle: darkMode ? '#b58a75' : '#8e6c53',
        noteTypeButton: darkMode ? '#b58a75' : '#8e6c53',
        about: darkMode ? '#333333' : '#ffffff',
        hr: darkMode ? '#494949' : '#aaaaaa',
        MuiCheckColor: '#cb561c',
      },
    }
  );

  const getEditorColor = () => (
    {
      default: {
        textColor: prefersDarkMode ? '#f0f0f0' : '#333333',
      },
      beiges: {
        textColor: prefersDarkMode ? '#fff9e2' : '#333333',
      },
      mintGreen: {
        textColor: prefersDarkMode ? '#eae9e5' : '#404040',
      },
      coffee: {
        textColor: prefersDarkMode ? '#f4f4f4' : '#8e6c53',
      },
    }
  );

  React.useEffect(() => {
    const editorColor = getEditorColor();
    overwriteEditorConfig(editorColor[color], 'editor-color');
  }, [prefersDarkMode, color]);

  const theme = React.useMemo(() => {
    const colorTheme = getColorTheme();
    const wizColor = Object.assign(colorTheme.default, colorTheme[color]);
    //
    return createMuiTheme({
      unstable_strictMode: true,
      palette: {
        type: prefersDarkMode ? 'dark' : 'light',
      },
      typography: {
        fontFamily: `'Open Sans', 'Noto Sans SC', Menlo, "Ubuntu Mono", Consolas, "Courier New", "Microsoft Yahei", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif`,
        button: {
          textTransform: 'none',
        },
      },
      overrides: {
        MuiIconButton: {
          root: {
            padding: 4,
            borderRadius: '4px',
            '& .MuiTouchRipple-root': {
              borderRadius: '4px',
            },
            '& .MuiTouchRipple-child': {
              borderRadius: '4px',
            },
          },
        },
        MuiSwitch: {
          colorSecondary: {
            '&$checked': {
              color: wizColor.MuiCheckColor,
            },
            '&$checked + $track': {
              backgroundColor: wizColor.MuiCheckColor,
              opacity: 0.2,
            },
          },
        },
        MuiCheckbox: {
          root: {
            padding: 4,
          },
          colorSecondary: {
            '&:hover': {
              backgroundColor: `${wizColor.MuiCheckColor}10`,
            },
            '&$checked': {
              color: wizColor.MuiCheckColor,
            },
          },
        },
        MuiPopover: {
          paper: {
            minWidth: 100,
          },
        },
        MuiPaper: {
          rounded: {
            borderRadius: 2,
          },
          elevation8: {
            boxShadow: prefersDarkMode ? '0 4px 8px 0 rgba(0, 0, 0, 0.2) !important' : 'rgba(15, 15, 15, 0.03) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 3px 6px, rgba(15, 15, 15, 0.05) 0px 9px 24px',
          },
        },
        MuiMenuItem: {
          root: {
            padding: '0 10px',
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: 14,
            height: 28,
            lineHeight: 28,
            '&:hover': {
              backgroundColor: prefersDarkMode ? 'rgba(255, 255, 255, .04)' : 'rgba(0, 0, 0, .04)',
            },
          },
        },
        MuiTypography: {
          h1: {
            fontWeight: 700,
          },
        },
      },
      custom: {
        getColorTheme,
        background: {
          noteList: wizColor.noteList,
          about: wizColor.about,
          noteListActive: wizColor.noteListActive,
          content: wizColor.content,
          contentGreen: 'rgb(237, 249, 240)',
          contentYellow: 'rgb(255, 248, 222)',
          sideDrawer: wizColor.sideDrawer,
          sidebarItemHover: wizColor.sidebarItemHover,
          dialogButtonBlack: prefersDarkMode ? '#f0f0f0' : '#333333',
          dialogButtonBlackHover: prefersDarkMode ? '#ffffff' : '#121212',
          login: prefersDarkMode ? '#101115' : '#fafafa',
          normalButtonHover: prefersDarkMode ? '#4a4a4a' : '#eaeaea',
          platformButton: '#f0f0f0',
          platformButtonHover: '#d8d8d8',
          previewBackdrop: 'rgba(255,255,255,0.5)',
        },
        color: {
          textHighlight: '#e82100',
          drawerText: prefersDarkMode ? '#d8d8d8' : '#ffffff',
          drawerTitle: '#aaa',
          noteTitle: wizColor.noteTitle,
          noteDate: wizColor.noteDate,
          noteAbstract: prefersDarkMode ? '#d8d8d8' : '#333333',
          noteTypeButton: wizColor.noteTypeButton,
          matchedText: '#aaaaaa',
          activeStarIcon: '#FDDD10',
          defaultStarIcon: wizColor.noteTypeButton,
          hr: wizColor.hr,
          contentToolIcon: '#aaaaaa',
          contentToolIconHover: prefersDarkMode ? '#ffffff' : '#333333',
          dialogButton: prefersDarkMode ? '#ffffff' : '#333333',
          dialogButtonBlack: prefersDarkMode ? '#333333' : '#ffffff',
          dialogText: '#aaaaaa',
          dialogTextHover: prefersDarkMode ? '#ffffff' : '#333333',
          dialogTextPrimary: prefersDarkMode ? '#ffffff' : '#333333',
          logoName: prefersDarkMode ? '#f0f0f0' : '#333333',
          forgetPasswordButton: '#448aff',
          windowBarTool: prefersDarkMode ? '#ffffff' : '#333333',
          windowBarLogo: '#f0f0f0',
          windowBar: '#f0f0f0',
          closeButtonHover: '#ffffff',
          normalButtonHover: prefersDarkMode ? '#ffffff' : '#333333',
          platformButton: '#333333',
          // lite input
          liteInputNormalBorder: '#d8d8d8',
          liteInputFocusBorder: '#006eff',
          liteInputErrorBorder: '#e82100',
        },
      },
    });
  }, [prefersDarkMode, color]);

  return (
    <ThemeProvider theme={theme}>
      {props.children}
    </ThemeProvider>
  );
}

ThemeSwitcher.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.array,
  ]).isRequired,
  color: PropTypes.string,
};

ThemeSwitcher.defaultProps = {
  color: 'default',
};
