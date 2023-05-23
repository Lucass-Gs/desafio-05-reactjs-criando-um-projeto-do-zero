import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-reactjs';
import { v4 as uuid } from 'uuid';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { createClient } from '../../../prismicio';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: string;
  };
}

interface PostProps {
  post: Post;
  readingTime?: number;
}

export default function Post({ post, readingTime }: PostProps) {
  if (!post) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${post?.data?.title || ''} | tg.news`}</title>
      </Head>

      <header className={styles.contentHeader}>
        <Header />
      </header>

      <section className={styles.banner}>
        <img src={post?.data?.banner.url} alt="banner" />
      </section>

      <section className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post?.data?.title}</h1>
          <div className={styles.postInfo}>
            <span>
              <img src="/images/calendar.svg" alt="calendar" />
              {format(parseISO(post?.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <img src="/images/user.svg" alt="user" />
              {post?.data?.author}
            </span>
            <span>
              <img src="/images/clock.svg" alt="user" />
              {readingTime}
            </span>
          </div>
        </article>
      </section>

      <section className={commonStyles.container}>
        <article className={styles.post}>
          <div className={styles.postContent}>
            {post.data.content?.map(item => (
              <div key={uuid()}>
                <h2>{item.heading}</h2>
                <div>{RichText.render(item.body)}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async ({ previewData }) => {
  const prismic = createClient({ previewData });
  const posts = await prismic.getAllByType('post');

  const paths = posts.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
}) => {
  const prismic = createClient({ previewData });
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {});

  const totalWords = response.data.content.reduce((acc, content) => {
    const headingWords = content.heading
      ? content.heading.split(/\s+/).length
      : 0;
    const bodyWords = content.body.reduce((bodyAcc, bodyItem) => {
      return bodyAcc + (bodyItem.text ? bodyItem.text.split(/\s+/).length : 0);
    }, 0);
    return acc + headingWords + bodyWords;
  }, 0);
  const readingTime = `${Math.ceil(totalWords / 200)} min`;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      readingTime,
    },
  };
};
