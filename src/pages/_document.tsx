import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";

export default class MyDocument extends Document {
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    const cache = createCache();
    const originalRenderPage = ctx.renderPage;

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => (props) => (
          <StyleProvider cache={cache}>
            <App {...props} />
          </StyleProvider>
        ),
      });

    const initialProps = await Document.getInitialProps(ctx);
    const antdStyles = extractStyle(cache, true);

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-antd-cssinjs
            dangerouslySetInnerHTML={{ __html: antdStyles }}
          />
        </>
      ),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* OpenGraph Meta Tags */}
          <meta property="og:title" content="开源社" />
          <meta name="baidu-site-verification" content="codeva-a8YKhUjSbh" />
          <meta
            name="keywords"
            content="开源社,KAIYUANSHE,开源,中国开源年会,中国开源,开源治理,开源社区,开源项目,开源软件,开源文化,开源教育,开源公益,开源之星,社区合作之星,COSCon之星"
          />
          <meta
            name="description"
            content="开源社,开源人的家,开源社（英文名称为 KAIYUANSHE）成立于2014年，是由志愿贡献于开源事业的个人志愿者，依贡献、共识、共治原则所组成的开源社区。开源社始终维持厂商中立、公益、非营利的理念，以立足中国、贡献全球，推动开源成为新时代的生活方式为愿景，以开源治理、国际接轨、社区发展、项目孵化为使命，旨在共创健康可持续发展的开源生态体系。"
          />
          <meta name="robots" content="index,follow" />
          <meta name="copyright" content="开源社" />
          <meta
            property="og:description"
            content="开源社,开源人的家,开源社（英文名称为 KAIYUANSHE）成立于2014年，是由志愿贡献于开源事业的个人志愿者，依贡献、共识、共治原则所组成的开源社区。"
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="" />
          <meta property="og:image" content="" />
          <meta property="og:site_name" content="开源社" />
          <link rel="icon" href="/logo.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
