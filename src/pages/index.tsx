import Head from 'next/head';
import { useState } from 'react';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { createClient } from '../../prismicio';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  const loadMorePosts = async (): Promise<void> => {
    if (nextPage) {
      const response = await fetch(nextPage);
      const data = await response.json();

      const newPosts = data.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setNextPage(data.next_page);
    }
  };
  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <header className={styles.contentHeader}>
        <Header />
      </header>
      <main>
        <div className={commonStyles.container}>
          {posts?.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <div className={styles.post}>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <span>
                    <img src="/images/calendar.svg" alt="calendar" />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                  <span>
                    <img src="/images/user.svg" alt="user" />
                    {post.data.author}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {nextPage && (
            <button
              className={styles.loadMoreButton}
              type="button"
              onClick={loadMorePosts}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ previewData }) => {
  const prismic = createClient({ previewData });

  const data = [
    'uid',
    'data.first_publication_date',
    'data.title',
    'data.subtitle',
    'data.author',
  ];

  const response = await prismic.getByType('post', {
    fetch: data,
    pageSize: 1,
  });

  const results = response.results?.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page: response.next_page,
      },
    },
  };
};
